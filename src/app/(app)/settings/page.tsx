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
import { useI18n } from "@/i18n/provider";

export default function SettingsPage() {
  const { data: profile, error, reload } = useProfile();
  const { t } = useI18n();

  return (
    <div className="max-w-3xl">
      <PageHeader title={t.settings.title} description={t.settings.description} />
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
