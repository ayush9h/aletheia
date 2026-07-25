import type { UserPrefProps } from "../user-pref";

export type PersonalizedSettingProps = {
  userPref: UserPrefProps;
  handleSave: (userPref: UserPrefProps) => Promise<void>;
  onOpenChange: (open: boolean) => void;
};
