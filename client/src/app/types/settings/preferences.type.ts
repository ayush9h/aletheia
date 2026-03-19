import { UserPrefProps } from "../user-pref";
export type PersonalizedSettingProps = {
  userPref: UserPrefProps;
  setUserPref: (pref: UserPrefProps) => void;
  handleSave: () => Promise<void> | void;
  onOpenChange: (open: boolean) => void;
};
