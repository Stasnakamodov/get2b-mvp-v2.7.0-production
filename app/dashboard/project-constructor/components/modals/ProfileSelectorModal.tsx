'use client';

import React from 'react';
import { Users, Check, Building2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Profile {
  id: string;
  name: string;
  legal_name?: string;
  company_name?: string;
  is_default?: boolean;
}

export type ProfileSelectorType = 'client' | 'supplier';

interface ProfileSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Generic list of profiles (client or supplier). Preferred prop.
   */
  profiles?: Profile[] | null;
  /**
   * Legacy prop (Step1 of project constructor). Used as fallback when `profiles`
   * is not provided. Treated as client profiles.
   */
  clientProfiles?: Profile[] | null;
  /**
   * Discriminator that controls dialog labels and accent color. Defaults to 'client'
   * to preserve existing call sites in the project constructor.
   */
  profileType?: ProfileSelectorType;
  selectedProfileId: string | null;
  onSelectProfile: (profileId: string) => void;
  onApplyProfile: () => Promise<void> | void;
  applyLabel?: string;
}

const TYPE_CONFIG: Record<
  ProfileSelectorType,
  {
    title: string;
    description: string;
    Icon: typeof Users;
    accentText: string;
    selectedBorder: string;
    selectedBg: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  client: {
    title: 'Выберите профиль клиента',
    description:
      'У вас несколько профилей клиентов. Выберите один, от имени которого продолжите.',
    Icon: Users,
    accentText: 'text-blue-500',
    selectedBorder: 'border-blue-500',
    selectedBg: 'bg-blue-50',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800',
  },
  supplier: {
    title: 'Выберите профиль поставщика',
    description:
      'У вас несколько профилей поставщиков. Выберите один — он будет указан как ваша компания.',
    Icon: Building2,
    accentText: 'text-emerald-500',
    selectedBorder: 'border-emerald-500',
    selectedBg: 'bg-emerald-50',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
  },
};

export default function ProfileSelectorModal({
  isOpen,
  onClose,
  profiles,
  clientProfiles,
  profileType = 'client',
  selectedProfileId,
  onSelectProfile,
  onApplyProfile,
  applyLabel = 'Применить профиль',
}: ProfileSelectorModalProps) {
  const items = profiles ?? clientProfiles ?? null;
  const cfg = TYPE_CONFIG[profileType];
  const Icon = cfg.Icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${cfg.accentText}`} />
            {cfg.title}
          </DialogTitle>
          <DialogDescription>{cfg.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {items?.map((profile) => {
            const isSelected = selectedProfileId === profile.id;
            const subtitle = profile.legal_name || profile.company_name || 'Юридическое название не указано';
            return (
              <div
                key={profile.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? `${cfg.selectedBorder} ${cfg.selectedBg}`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onSelectProfile(profile.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{profile.name}</h4>
                    <p className="text-sm text-gray-500">{subtitle}</p>
                    {profile.is_default && (
                      <span
                        className={`inline-block mt-1 px-2 py-1 text-xs ${cfg.badgeBg} ${cfg.badgeText} rounded`}
                      >
                        По умолчанию
                      </span>
                    )}
                  </div>
                  {isSelected && <Check className={`h-5 w-5 ${cfg.accentText}`} />}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button
            onClick={onApplyProfile}
            disabled={!selectedProfileId}
            className="gap-2"
          >
            <Check className="h-4 w-4" />
            {applyLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
