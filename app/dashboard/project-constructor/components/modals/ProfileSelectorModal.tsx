'use client';

import React from 'react';
import { Users, Check } from 'lucide-react';
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
  is_default?: boolean;
}

interface ProfileSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientProfiles: Profile[] | null;
  selectedProfileId: string | null;
  onSelectProfile: (profileId: string) => void;
  onApplyProfile: () => Promise<void>;
}

export default function ProfileSelectorModal({
  isOpen,
  onClose,
  clientProfiles,
  selectedProfileId,
  onSelectProfile,
  onApplyProfile,
}: ProfileSelectorModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Выберите профиль клиента
          </DialogTitle>
          <DialogDescription>
            У вас несколько профилей клиентов. Выберите один для заполнения данных компании.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {clientProfiles?.map((profile) => (
            <div
              key={profile.id}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedProfileId === profile.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onSelectProfile(profile.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{profile.name}</h4>
                  <p className="text-sm text-gray-500">
                    {profile.legal_name || 'Юридическое название не указано'}
                  </p>
                  {profile.is_default && (
                    <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                      По умолчанию
                    </span>
                  )}
                </div>
                {selectedProfileId === profile.id && (
                  <Check className="h-5 w-5 text-blue-500" />
                )}
              </div>
            </div>
          ))}
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
            Применить профиль
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
