import uuid
from typing import Dict, Optional, Any
from datetime import datetime
from schemas import (
    PreferenceQuery, RecommendationResult, FoodOut,
    StructuredConstraints, StructuredPreferences
)


class SessionData:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.preferences: PreferenceQuery = PreferenceQuery()
        self.constraints: StructuredConstraints = StructuredConstraints()
        self.pref_settings: StructuredPreferences = StructuredPreferences()
        self.last_result: Optional[RecommendationResult] = None
        self.last_recommendations: list[FoodOut] = []
        self.history: list = []
        self.turn_count: int = 0
        self.conversation_stage: str = "initial"  # "initial", "refining", "ready_to_order"
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

    def reset(self):
        self.preferences = PreferenceQuery()
        self.constraints = StructuredConstraints()
        self.pref_settings = StructuredPreferences()
        self.last_result = None
        self.last_recommendations = []
        self.history = []
        self.turn_count = 0
        self.conversation_stage = "initial"
        self.updated_at = datetime.utcnow()

    def update_structured_state(
        self,
        new_constraints: StructuredConstraints,
        new_preferences: StructuredPreferences
    ) -> tuple[StructuredConstraints, StructuredPreferences]:
        """
        Phase 15: Maintains structured conversation state.
        Preserves previous constraints unless explicitly updated.
        """
        self.updated_at = datetime.utcnow()
        self.turn_count += 1
        if self.turn_count > 1:
            self.conversation_stage = "refining"

        # Update constraints (preserve previous if not specified)
        if new_constraints.max_price is not None:
            self.constraints.max_price = new_constraints.max_price
        if new_constraints.max_preparation_time is not None:
            self.constraints.max_preparation_time = new_constraints.max_preparation_time
        if new_constraints.diet:
            for d in new_constraints.diet:
                if d not in self.constraints.diet:
                    self.constraints.diet.append(d)
        if new_constraints.allergies:
            for a in new_constraints.allergies:
                if a not in self.constraints.allergies:
                    self.constraints.allergies.append(a)
        if new_constraints.exclusions:
            for e in new_constraints.exclusions:
                if e not in self.constraints.exclusions:
                    self.constraints.exclusions.append(e)

        # Update preferences
        if new_preferences.spicy is not None:
            self.pref_settings.spicy = new_preferences.spicy
        if new_preferences.sweet is not None:
            self.pref_settings.sweet = new_preferences.sweet
        if new_preferences.high_protein is not None:
            self.pref_settings.high_protein = new_preferences.high_protein
        if new_preferences.low_calorie is not None:
            self.pref_settings.low_calorie = new_preferences.low_calorie
        if new_preferences.cuisine is not None:
            self.pref_settings.cuisine = new_preferences.cuisine
        if new_preferences.mood is not None:
            self.pref_settings.mood = new_preferences.mood
        if new_preferences.craving is not None:
            self.pref_settings.craving = new_preferences.craving

        # Keep legacy PreferenceQuery in sync for backward compatibility
        self.preferences.budget = self.constraints.max_price
        self.preferences.time_limit = self.constraints.max_preparation_time
        if self.constraints.diet:
            self.preferences.diet = self.constraints.diet[0]
        self.preferences.exclusions = list(self.constraints.exclusions)
        tastes = []
        if self.pref_settings.spicy is True:
            tastes.append("spicy")
        elif self.pref_settings.spicy is False:
            tastes.append("mild")
        if self.pref_settings.sweet is True:
            tastes.append("sweet")
        self.preferences.taste = tastes
        if self.pref_settings.high_protein:
            self.preferences.protein_goal = "high"
        self.preferences.cuisine = self.pref_settings.cuisine
        self.preferences.mood = self.pref_settings.mood
        if self.pref_settings.craving:
            self.preferences.cravings = [self.pref_settings.craving]

        return self.constraints, self.pref_settings

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

