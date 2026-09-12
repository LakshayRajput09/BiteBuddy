import uuid
from typing import Dict, Optional, Any
from datetime import datetime
from schemas import PreferenceQuery, RecommendationResult


class SessionData:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.preferences: PreferenceQuery = PreferenceQuery()
        self.last_result: Optional[RecommendationResult] = None
        self.history: list = []
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

    def update_preferences(self, new_prefs: PreferenceQuery) -> PreferenceQuery:
        """
        Merges new constraints/refinements into the ongoing session state.
        Preserves existing parameters unless explicitly overridden.
        """
        self.updated_at = datetime.utcnow()

        # Merge budget
        if new_prefs.budget is not None:
            self.preferences.budget = new_prefs.budget

        # Merge diet
        if new_prefs.diet is not None:
            self.preferences.diet = new_prefs.diet

        # Merge taste (union without duplicates)
        if new_prefs.taste:
            existing_tastes = set(self.preferences.taste or [])
            for t in new_prefs.taste:
                if t not in existing_tastes:
                    self.preferences.taste.append(t)

        # Merge mood
        if new_prefs.mood is not None:
            self.preferences.mood = new_prefs.mood

        # Merge cravings
        if new_prefs.cravings:
            existing_cravings = set(self.preferences.cravings or [])
            for c in new_prefs.cravings:
                if c not in existing_cravings:
                    self.preferences.cravings.append(c)

        # Merge time limit
        if new_prefs.time_limit is not None:
            self.preferences.time_limit = new_prefs.time_limit

        # Merge cuisine
        if new_prefs.cuisine is not None:
            self.preferences.cuisine = new_prefs.cuisine

        # Merge exclusions
        if new_prefs.exclusions:
            existing_exclusions = set(self.preferences.exclusions or [])
            for e in new_prefs.exclusions:
                if e not in existing_exclusions:
                    self.preferences.exclusions.append(e)

        return self.preferences


class SessionManager:
    def __init__(self):
        self._sessions: Dict[str, SessionData] = {}

    def get_or_create(self, session_id: Optional[str] = None) -> SessionData:
        if not session_id or session_id not in self._sessions:
            new_id = session_id or str(uuid.uuid4())
            session = SessionData(new_id)
            self._sessions[new_id] = session
            return session
        return self._sessions[session_id]

    def get(self, session_id: str) -> Optional[SessionData]:
        return self._sessions.get(session_id)

    def reset_session(self, session_id: str) -> SessionData:
        session = SessionData(session_id)
        self._sessions[session_id] = session
        return session


# Singleton instance
session_store = SessionManager()

