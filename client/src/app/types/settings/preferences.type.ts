import { UserPrefProps } from "../userPref";
export type PersonalizedSettingProps = {
  userPref: UserPrefProps;
  setUserPref: (pref: UserPrefProps) => void;
  handleSave: () => Promise<void> | void;
  onOpenChange: (open: boolean) => void;
};
