"""
WebSocket manager for real-time health data streaming.
Supports:
  - Multiple concurrent patient connections
  - Real-time wearable data updates
  - Continuous prediction updates
  - Critical risk alerts
"""
from __future__ import annotations
import asyncio
import json
import logging
import random
from datetime import datetime
from typing import Dict, Set

from fastapi import WebSocket, WebSocketDisconnect

log = logging.getLogger("metatwin-x.websocket")


class ConnectionManager:
    """Manages active WebSocket connections per patient."""

    def __init__(self):
        # patient_id → set of active websockets
        self._connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, patient_id: str, ws: WebSocket):
        await ws.accept()
        if patient_id not in self._connections:
            self._connections[patient_id] = set()
        self._connections[patient_id].add(ws)
        log.info("WebSocket connected: patient=%s  total=%d",
                 patient_id, self.connection_count)

    def disconnect(self, patient_id: str, ws: WebSocket):
        if patient_id in self._connections:
            self._connections[patient_id].discard(ws)
            if not self._connections[patient_id]:
                del self._connections[patient_id]
        log.info("WebSocket disconnected: patient=%s", patient_id)

    async def send_to_patient(self, patient_id: str, message: dict):
        """Send a message to all connections for a patient."""
        ws_set = self._connections.get(patient_id, set())
        dead   = set()
        for ws in ws_set:
            try:
                await ws.send_text(json.dumps(message))
            except Exception:
                dead.add(ws)
        for ws in dead:
            self._connections[patient_id].discard(ws)

    async def broadcast(self, message: dict):
        """Broadcast to all connected patients."""
        for pid in list(self._connections.keys()):
            await self.send_to_patient(pid, message)

    @property
    def connection_count(self) -> int:
        return sum(len(v) for v in self._connections.values())

    def is_connected(self, patient_id: str) -> bool:
        return patient_id in self._connections and bool(self._connections[patient_id])


# Singleton
manager = ConnectionManager()


async def stream_wearable_updates(
    patient_id: str,
    ws: WebSocket,
    initial_scores: dict,
    interval_seconds: float = 3.0,
):
    """
    Stream simulated wearable updates to the client every interval_seconds.
    In production, replace simulation with real device API polling.
    """
    base_hr = random.uniform(62, 78)
    base_hrv = random.uniform(32, 55)
    base_spo2 = random.uniform(96, 99)

    scores = dict(initial_scores)
    step   = 0

    try:
        while True:
            step += 1
            # Simulate realistic wearable fluctuations
            hr     = base_hr   + random.gauss(0, 4)
            hrv    = base_hrv  + random.gauss(0, 3)
            spo2   = min(100, base_spo2 + random.gauss(0, 0.4))
            stress = max(0, min(100, 35 + random.gauss(0, 12)))
            steps  = max(0, int(random.gauss(350, 80)))

            # Slightly drift scores with wearable data
            if hr > 85:
                scores["heart"] = min(0.99, scores["heart"] + 0.001)
            if spo2 < 95:
                scores["heart"] = min(0.99, scores["heart"] + 0.002)
                scores["kidney"]= min(0.99, scores["kidney"]+ 0.001)

            payload = {
                "type":    "wearable_update",
                "patient": patient_id,
                "timestamp": datetime.utcnow().isoformat(),
                "wearable": {
                    "heart_rate":  round(hr, 1),
                    "hrv_ms":      round(hrv, 1),
                    "spo2_pct":    round(spo2, 1),
                    "stress_score": round(stress, 0),
                    "steps_delta": steps,
                },
                "scores": {
                    "heart":  round(scores["heart"],  4),
                    "kidney": round(scores["kidney"], 4),
                    "liver":  round(scores["liver"],  4),
                },
                "step": step,
            }

            # Critical alert
            max_risk = max(scores.values())
            if max_risk >= 0.80:
                payload["alert"] = {
                    "level":   "critical",
                    "message": "Risk score has reached critical level. Immediate attention required.",
                    "organ":   max(scores, key=lambda o: scores[o]),
                }

            await ws.send_text(json.dumps(payload))
            await asyncio.sleep(interval_seconds)

    except (WebSocketDisconnect, asyncio.CancelledError):
        manager.disconnect(patient_id, ws)
    except Exception as e:
        log.error("WebSocket stream error for patient %s: %s", patient_id, e)
        manager.disconnect(patient_id, ws)
