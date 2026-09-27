"use client";

import { ErrorState } from "@/components/common/states";
import { PageHeader } from "@/components/layout/page-header";
import {
  AppearanceSection,
  CategoriesSection,
  FinanceSection,
  NotificationSection,
  ProfileSection,
  RegionSection,
  SecuritySection,
} from "@/components/settings/settings-sections";
import { Card } from "@/components/ui/card";
import { SkeletonCard } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/use-profile";

export default function SettingsPage() {
  const { data: profile, error, reload } = useProfile();

  return (
    <div className="max-w-3xl">
      <PageHeader title="Cài đặt" description="Hồ sơ, giao diện, thiết lập tài chính và bảo mật." />
      {error ? (
        <Card>
          <ErrorState onRetry={reload} />
        </Card>
      ) : !profile ? (
        <div className="space-y-4">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </div>
      ) : (
        <div className="space-y-4">
          <ProfileSection profile={profile} />
          <AppearanceSection />
          <RegionSection />
          <FinanceSection profile={profile} />
          <CategoriesSection />
          <NotificationSection profile={profile} />
          <SecuritySection />
        </div>
      )}
    </div>
  );
}
