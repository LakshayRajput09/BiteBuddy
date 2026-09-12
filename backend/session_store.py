import uuid
from typing import Dict, Optional, Any
from datetime import datetime
from schemas import PreferenceQuery, RecommendationResult, FoodOut


class SessionData:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.preferences: PreferenceQuery = PreferenceQuery()
        self.last_result: Optional[RecommendationResult] = None
        self.last_recommendations: list[FoodOut] = []
        self.history: list = []
        self.turn_count: int = 0
        self.conversation_stage: str = "initial"  # "initial", "refining", "ready_to_order"
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

    def reset(self):
        self.preferences = PreferenceQuery()
        self.last_result = None
        self.last_recommendations = []
        self.history = []
        self.turn_count = 0
        self.conversation_stage = "initial"
        self.updated_at = datetime.utcnow()

    def update_preferences(self, new_prefs: PreferenceQuery) -> PreferenceQuery:
        """
        Merges new constraints/refinements into the ongoing session state.
        Preserves existing parameters unless explicitly overridden.
        """
        self.updated_at = datetime.utcnow()
        self.turn_count += 1
        if self.turn_count > 1:
            self.conversation_stage = "refining"

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

        # Merge protein goal
        if new_prefs.protein_goal is not None:
            self.preferences.protein_goal = new_prefs.protein_goal

        return self.preferences

    def set_last_recommendations(self, items: list[FoodOut]):
        self.last_recommendations = items

    def resolve_reference(self, text: str) -> Optional[FoodOut]:
        """
        Resolves references to previously recommended items:
        - "first one", "1st", "item 1", "top pick"
        - "second one", "2nd", "alternative 1"
        - "third one", "3rd", "alternative 2"
        - "cheapest", "cheaper one"
        - "highest protein"
        - dish name match within last_recommendations
        - "it", "that", "this"
        """
        if not self.last_recommendations:
            return None

        lower = text.lower().strip()

        # 1. Ordinal references
        if any(p in lower for p in ["first", "1st", "number one", "top pick", "best match", "primary", "#1", "first one"]):
            if len(self.last_recommendations) >= 1:
                return self.last_recommendations[0]

        if any(p in lower for p in ["second", "2nd", "number two", "#2", "second one", "alt 1", "alternative 1"]):
            if len(self.last_recommendations) >= 2:
                return self.last_recommendations[1]

        if any(p in lower for p in ["third", "3rd", "number three", "#3", "third one", "alt 2", "alternative 2"]):
            if len(self.last_recommendations) >= 3:
                return self.last_recommendations[2]

        # 2. Superlative references
        if any(p in lower for p in ["cheapest", "cheaper one", "least expensive"]):
            return min(self.last_recommendations, key=lambda x: x.price)

        if any(p in lower for p in ["highest protein", "most protein", "max protein"]):
            return max(self.last_recommendations, key=lambda x: x.protein or 0)

        if any(p in lower for p in ["fastest", "quickest", "least time"]):
            return min(self.last_recommendations, key=lambda x: x.preparation_time)

        if any(p in lower for p in ["lowest calorie", "lightest"]):
            return min(self.last_recommendations, key=lambda x: x.calories or 999)

        # 3. Substring matching of dish name/category
        for item in self.last_recommendations:
            if item.name.lower() in lower or any(word in lower for word in item.name.lower().split() if len(word) > 3):
                return item

        # 4. Pronoun fallback ("it", "that", "this", "the meal", "the dish")
        if any(p in lower for p in [" it", "that", "this", "the meal", "the dish", "order it"]):
            return self.last_recommendations[0]

        return None


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

