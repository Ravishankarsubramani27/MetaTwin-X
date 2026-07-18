"""SQLite database with SQLAlchemy — stores patients, health records, simulation logs."""
from __future__ import annotations
import os
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional, List

from sqlalchemy import (
    create_engine, Column, Integer, String, Float,
    Text, DateTime, ForeignKey, Boolean
)
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session, relationship

log = logging.getLogger("metatwin-x.db")

DB_PATH = Path(__file__).parent.parent.parent / "data" / "metatwin.db"
DB_PATH.parent.mkdir(exist_ok=True)

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")
engine        = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal  = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


class Patient(Base):
    __tablename__ = "patients"
    id         = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String, unique=True, index=True, nullable=False)
    name       = Column(String, nullable=True)
    age        = Column(Integer, nullable=True)
    sex        = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    records    = relationship("HealthRecord", back_populates="patient",
                              cascade="all, delete-orphan")
    simulations = relationship("SimulationLog", back_populates="patient",
                               cascade="all, delete-orphan")


class HealthRecord(Base):
    __tablename__ = "health_records"
    id           = Column(Integer, primary_key=True, index=True)
    patient_id   = Column(String, ForeignKey("patients.patient_id"), nullable=False)
    timestamp    = Column(DateTime, default=datetime.utcnow, index=True)
    # Biomarkers
    age          = Column(Float)
    bmi          = Column(Float)
    systolic_bp  = Column(Float)
    fasting_glucose = Column(Float)
    total_cholesterol = Column(Float)
    serum_creatinine = Column(Float)
    alt_enzyme   = Column(Float)
    ast_enzyme   = Column(Float)
    # Risk scores
    heart_risk   = Column(Float)
    kidney_risk  = Column(Float)
    liver_risk   = Column(Float)
    # Wearable (optional)
    hr_resting   = Column(Float, nullable=True)
    hrv_ms       = Column(Float, nullable=True)
    spo2_pct     = Column(Float, nullable=True)
    # Full snapshot JSON
    snapshot_json = Column(Text, nullable=True)
    patient       = relationship("Patient", back_populates="records")


class SimulationLog(Base):
    __tablename__ = "simulation_logs"
    id           = Column(Integer, primary_key=True, index=True)
    patient_id   = Column(String, ForeignKey("patients.patient_id"), nullable=False)
    timestamp    = Column(DateTime, default=datetime.utcnow)
    scenario     = Column(String, default="Baseline")
    horizon_days = Column(Integer)
    peak_heart   = Column(Float)
    peak_kidney  = Column(Float)
    peak_liver   = Column(Float)
    trajectory_json = Column(Text)  # compressed trajectory
    patient      = relationship("Patient", back_populates="simulations")


class AlertLog(Base):
    __tablename__ = "alert_logs"
    id          = Column(Integer, primary_key=True, index=True)
    patient_id  = Column(String, index=True)
    timestamp   = Column(DateTime, default=datetime.utcnow)
    organ       = Column(String)
    risk_level  = Column(String)   # low | moderate | high | critical
    risk_score  = Column(Float)
    resolved    = Column(Boolean, default=False)
    message     = Column(Text)


# ── Create tables ──────────────────────────────────────────────────────
def init_db():
    Base.metadata.create_all(bind=engine)
    log.info("Database initialised at %s", DB_PATH)


# ── Dependency ─────────────────────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── CRUD helpers ───────────────────────────────────────────────────────
def upsert_patient(db: Session, patient_id: str, name: str = None,
                   age: int = None, sex: str = None) -> Patient:
    p = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not p:
        p = Patient(patient_id=patient_id, name=name, age=age, sex=sex)
        db.add(p)
    else:
        if name: p.name = name
        if age:  p.age  = age
        if sex:  p.sex  = sex
    db.commit()
    db.refresh(p)
    return p


def save_health_record(db: Session, patient_id: str, snapshot_dict: dict,
                       scores: dict) -> HealthRecord:
    r = HealthRecord(
        patient_id=patient_id,
        age=snapshot_dict.get("age"),
        bmi=snapshot_dict.get("bmi"),
        systolic_bp=snapshot_dict.get("systolic_bp"),
        fasting_glucose=snapshot_dict.get("fasting_glucose"),
        total_cholesterol=snapshot_dict.get("total_cholesterol"),
        serum_creatinine=snapshot_dict.get("serum_creatinine"),
        alt_enzyme=snapshot_dict.get("alt_enzyme"),
        ast_enzyme=snapshot_dict.get("ast_enzyme"),
        heart_risk=scores.get("heart"),
        kidney_risk=scores.get("kidney"),
        liver_risk=scores.get("liver"),
        hr_resting=snapshot_dict.get("heart_rate_resting"),
        hrv_ms=snapshot_dict.get("hrv_ms"),
        spo2_pct=snapshot_dict.get("spo2_pct"),
        snapshot_json=json.dumps(snapshot_dict),
    )
    db.add(r); db.commit(); db.refresh(r)
    return r


def get_patient_history(db: Session, patient_id: str, limit: int = 30) -> List[HealthRecord]:
    return (db.query(HealthRecord)
              .filter(HealthRecord.patient_id == patient_id)
              .order_by(HealthRecord.timestamp.desc())
              .limit(limit).all())


def save_simulation(db: Session, patient_id: str, scenario: str,
                    horizon_days: int, peak: dict, trajectory: list) -> SimulationLog:
    s = SimulationLog(
        patient_id=patient_id, scenario=scenario,
        horizon_days=horizon_days,
        peak_heart=peak.get("heart"),
        peak_kidney=peak.get("kidney"),
        peak_liver=peak.get("liver"),
        trajectory_json=json.dumps(trajectory[:30]),  # store first 30 points
    )
    db.add(s); db.commit(); db.refresh(s)
    return s


def log_alert(db: Session, patient_id: str, organ: str,
              risk_score: float, message: str) -> AlertLog:
    level = "critical" if risk_score >= 0.85 else "high" if risk_score >= 0.7 else "moderate"
    a = AlertLog(patient_id=patient_id, organ=organ,
                 risk_level=level, risk_score=risk_score, message=message)
    db.add(a); db.commit(); db.refresh(a)
    return a
