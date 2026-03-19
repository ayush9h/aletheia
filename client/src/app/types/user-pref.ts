/**
 * User-level personalization preferences */
export type UserPrefProps = {
  userId?: string;

  /**
   * Preferred conversational tone shaping.
   */
  nickname: string;

  /**
   * Professional context used to bias explanations,
   * examples, and terminology depth.
   */
  occupation: string;

  /**
   * Baseline conversational tone profile.
   */
  baseTone: string;

  /**
   * Free-form persistent instruction
   */
  userCustomInstruction: string;

  /**
   * Interest signals used for recommendation.
   */
  userHobbies: string;
};
