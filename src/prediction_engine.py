"""Prediction engine: parallel inference across heart, kidney, liver models."""
from __future__ import annotations
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
import joblib
import numpy as np
from src.models.data_types import FeatureBundle, FeatureVector, RawScores, Organ
from src.exceptions import ModelLoadError, PredictionError


def _latest_version_dir(base: Path) -> Path:
    """Return the most recently date-stamped subdirectory."""
    dirs = sorted([d for d in base.iterdir() if d.is_dir()], reverse=True)
    if not dirs:
        raise ModelLoadError(f"No model directories found in {base}")
    return dirs[0]


class MockModel:
    """Synthetic model for running without real trained artifacts."""
    def __init__(self, organ: Organ, seed: int = 42):
        self.organ = organ
        self._rng = np.random.default_rng(seed)

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        # Heuristic: weighted sum of features → sigmoid → risk score
        weights = self._rng.uniform(0.5, 1.5, size=X.shape[1])
        weights /= weights.sum()
        logit = (X @ weights) * 4.0 - 2.0
        prob = 1.0 / (1.0 + np.exp(-logit))
        return np.column_stack([1 - prob, prob])


class RegressorProbaWrapper:
    """
    Wraps an XGBRegressor (trained on continuous risk probabilities)
    to expose a predict_proba(X) interface compatible with the engine.
    Must live at module level for joblib pickling.
    """
    def __init__(self, regressor):
        self._reg = regressor
        self.n_features_in_ = getattr(regressor, 'n_features_in_', None)

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        p = np.clip(self._reg.predict(X), 0.0, 1.0).reshape(-1, 1)
        return np.hstack([1 - p, p])


class MockExplainer:
    """Synthetic SHAP explainer."""
    def __init__(self, model: MockModel, feature_dim: int):
        self._model = model
        self._dim = feature_dim
        self._rng = np.random.default_rng(99)

    @property
    def expected_value(self):
        return 0.35

    def shap_values(self, X: np.ndarray) -> np.ndarray:
        raw = self._rng.uniform(-0.15, 0.15, size=(X.shape[0], self._dim))
        return raw


class PredictionEngine:
    def __init__(self, model_dir: Path):
        self._models: dict[Organ, object] = {}
        self._explainers: dict[Organ, object] = {}
        self._load_models(model_dir)

    def _load_models(self, model_dir: Path):
        for organ in Organ:
            organ_dir = model_dir / organ.value
            model_pkl = None
            explainer_pkl = None

            # Try to load real artifacts
            if organ_dir.exists():
                try:
                    version_dir = _latest_version_dir(organ_dir)
                    model_pkl = version_dir / "model.pkl"
                    explainer_pkl = version_dir / "explainer.pkl"
                except ModelLoadError:
                    pass

            if model_pkl and model_pkl.exists():
                try:
                    self._models[organ] = joblib.load(model_pkl)
                    self._explainers[organ] = joblib.load(explainer_pkl)
                except Exception as e:
                    raise ModelLoadError(f"Failed to load {organ.value} model: {e}")
            else:
                # Fall back to mock model — dims match updated feature vectors
                dims = {Organ.HEART: 16, Organ.KIDNEY: 22, Organ.LIVER: 13}
                mock = MockModel(organ)
                self._models[organ] = mock
                self._explainers[organ] = MockExplainer(mock, dims[organ])

    def predict_organ(self, organ: Organ, vector: FeatureVector) -> float:
        try:
            X = vector.values.reshape(1, -1)
            model = self._models[organ]

            # Handle shape mismatch between saved model and current feature vector.
            # Works for both raw XGBClassifier and CalibratedClassifierCV wrappers.
            expected = None
            if hasattr(model, 'n_features_in_'):
                expected = model.n_features_in_
            elif hasattr(model, 'estimators_'):
                # CalibratedClassifierCV
                try:
                    expected = model.estimators_[0].n_features_in_
                except Exception:
                    pass
            elif hasattr(model, 'calibrated_classifiers_'):
                try:
                    expected = model.calibrated_classifiers_[0].estimator.n_features_in_
                except Exception:
                    pass

            if expected is not None:
                actual = X.shape[1]
                if actual > expected:
                    X = X[:, :expected]
                elif actual < expected:
                    pad = np.zeros((1, expected - actual), dtype=np.float32)
                    X = np.concatenate([X, pad], axis=1)

            proba = model.predict_proba(X)
            # predict_proba may return shape (1,1) if only one class in training
            if proba.shape[1] == 1:
                score = float(proba[0, 0])
            else:
                score = float(proba[0, 1])
            return float(np.clip(score, 0.0, 1.0))
        except Exception as e:
            raise PredictionError(f"{organ.value} prediction failed: {e}") from e

    def predict_all(self, bundle: FeatureBundle) -> RawScores:
        tasks = {
            Organ.HEART: bundle.heart,
            Organ.KIDNEY: bundle.kidney,
            Organ.LIVER: bundle.liver,
        }
        results = {}
        with ThreadPoolExecutor(max_workers=3) as executor:
            futures = {
                executor.submit(self.predict_organ, organ, vec): organ
                for organ, vec in tasks.items()
            }
            for future in as_completed(futures):
                organ = futures[future]
                results[organ] = future.result()

        return RawScores(
            heart=results[Organ.HEART],
            kidney=results[Organ.KIDNEY],
            liver=results[Organ.LIVER],
        )

    def get_explainer(self, organ: Organ):
        return self._explainers[organ]
