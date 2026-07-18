/**
 * appStore.js
 * Lightweight global state without external library.
 * Uses React context + useReducer pattern.
 * Drop-in compatible with existing prop-drilling in Home.js.
 */
import React, { createContext, useContext, useReducer, useCallback } from "react";

const initialState = {
  risk:       null,   // { heart, kidney, liver } fractions
  recs:       null,   // recommendations object
  formData:   null,   // last submitted biomarkers
  auditLog:   [],     // interaction rule audit
  twinState:  null,   // digital twin metadata
  patientId:  null,   // current patient ID
  theme:      localStorage.getItem("mt_theme") || "dark-blue",
  notifications: (() => {
    try { return JSON.parse(localStorage.getItem("mt_notifs") || "{}"); }
    catch { return {}; }
  })(),
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_RISK":      return { ...state, risk:      action.payload };
    case "SET_RECS":      return { ...state, recs:      action.payload };
    case "SET_FORM_DATA": return { ...state, formData:  action.payload };
    case "SET_AUDIT_LOG": return { ...state, auditLog:  action.payload };
    case "SET_TWIN":      return { ...state, twinState: action.payload };
    case "SET_PATIENT_ID":return { ...state, patientId: action.payload };
    case "SET_THEME":     return { ...state, theme:     action.payload };
    case "SET_NOTIFS":    return { ...state, notifications: action.payload };
    case "CLEAR_SESSION": return {
      ...initialState,
      patientId:     state.patientId,
      theme:         state.theme,
      notifications: state.notifications,
    };
    default: return state;
  }
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const actions = {
    setRisk:      useCallback(p => dispatch({ type:"SET_RISK",       payload:p }), []),
    setRecs:      useCallback(p => dispatch({ type:"SET_RECS",       payload:p }), []),
    setFormData:  useCallback(p => dispatch({ type:"SET_FORM_DATA",  payload:p }), []),
    setAuditLog:  useCallback(p => dispatch({ type:"SET_AUDIT_LOG",  payload:p }), []),
    setTwinState: useCallback(p => dispatch({ type:"SET_TWIN",       payload:p }), []),
    setPatientId: useCallback(p => dispatch({ type:"SET_PATIENT_ID", payload:p }), []),
    setTheme:     useCallback(p => dispatch({ type:"SET_THEME",      payload:p }), []),
    setNotifs:    useCallback(p => dispatch({ type:"SET_NOTIFS",     payload:p }), []),
    clearSession: useCallback(()=> dispatch({ type:"CLEAR_SESSION"               }), []),
  };

  return (
    <AppContext.Provider value={{ state, ...actions }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppStore must be used inside AppProvider");
  return ctx;
}
