import { useEffect } from 'react';
import { useSearchParams } from 'react-router';
import AccountSection from '@/components/settings/AccountSection';
import DataSection from '@/components/settings/DataSection';
import DeveloperSection from '@/components/settings/DeveloperSection';
import PreferencesSection from '@/components/settings/PreferencesSection';
import ProfileSection from '@/components/settings/ProfileSection';
import SettingsNav from '@/components/settings/SettingsNav';
import { takeFlashMessage } from '@/components/settings/browserData';
import { resolveSection, SETTINGS_SECTIONS } from '@/components/settings/settingsSections';
import PageHeader from '@/components/layout/PageHeader';
import { useToast } from '@/context/ToastContext';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import './SettingsPage.scss';

const SECTION_COMPONENTS = {
  profile: ProfileSection,
  preferences: PreferencesSection,
  data: DataSection,
  developer: DeveloperSection,
  account: AccountSection,
};

/**
 * Settings: sub-navigation (sidebar from md, pill strip below) and one section at a time.
 * The section lives in `?section=` so refresh, back and shared links keep it.
 */
export default function SettingsPage() {
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const section = resolveSection(searchParams.get('section'));
  const Section = SECTION_COMPONENTS[section];
  const label = SETTINGS_SECTIONS.find((entry) => entry.id === section)?.label;

  useDocumentTitle(section === 'profile' ? 'Settings' : `${label} settings`);

  // A message left before a full reload (for example after resetting the demo data).
  useEffect(() => {
    const message = takeFlashMessage();
    if (message) toast.success(message);
  }, [toast]);

  return (
    <div className="settings-page">
      <PageHeader title="Settings" subtitle="Profile, preferences and your data." documentTitle={false} />
      <div className="settings-page__layout">
        <SettingsNav active={section} />
        <div className="settings-page__content">
          <Section key={section} />
        </div>
      </div>
    </div>
  );
}
