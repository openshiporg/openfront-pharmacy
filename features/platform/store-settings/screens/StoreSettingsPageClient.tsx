'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import * as SelectPrimitive from '@radix-ui/react-select';
import { LOGO_ICONS, HUE_PRESETS } from '../lib/icon-registry';
import { updateStoreSettings, type StoreSettings } from '../actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Code, Store } from 'lucide-react';

interface StoreSettingsPageClientProps {
  initialData: StoreSettings[];
  initialError: string | null;
}

function StoreSettingsForm({ store }: { store: StoreSettings }) {
  const [name, setName] = useState(store.operatorDisplayName || '');
  const [logoIcon, setLogoIcon] = useState(
    store.logoIcon || LOGO_ICONS[0].lightSvg
  );
  const [logoColor, setLogoColor] = useState(store.logoColor || '0');
  const [tagline, setTagline] = useState(store.operatorTagline || '');
  const [supportEmail, setSupportEmail] = useState(store.supportEmail || '');
  const [supportPhone, setSupportPhone] = useState(store.supportPhone || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    const result = await updateStoreSettings(store.id, {
      operatorDisplayName: name,
      operatorTagline: tagline,
      logoIcon,
      logoColor,
      supportEmail,
      supportPhone,
    });

    if (result.success) {
      toast.success('Store settings updated successfully');
    } else {
      toast.error(result.error || 'Failed to update store settings');
    }
    setIsLoading(false);
  };

  // Find matching preset icon, but don't default to first icon if not found
  const selectedIcon = LOGO_ICONS.find((icon) => icon.lightSvg === logoIcon);

  return (
    <div className="space-y-6">
      {/* Store Name */}
      <div>
        <Label htmlFor="store-name">Store Name</Label>
        <Input
          id="store-name"
          value={name}
          maxLength={120}
          onChange={(e) => setName(e.target.value)}
          className="mt-2"
        />
      </div>

      {/* Logo Icon Selector */}
      <div>
        <Label>Logo Icon</Label>
        <div className="mt-2 flex items-center gap-2">
          <Select
            value={selectedIcon?.id || ''}
            onValueChange={(id) => {
              const icon = LOGO_ICONS.find((i) => i.id === id);
              if (icon) setLogoIcon(icon.lightSvg);
            }}
          >
            <SelectPrimitive.Trigger
              aria-label="Logo icon"
              className={cn(
                'flex h-12 w-12 shrink-0 rounded-lg border border-input bg-background focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 p-0 overflow-hidden items-center justify-center'
              )}
            >
              <div
                dangerouslySetInnerHTML={{ __html: logoIcon }}
                style={{ filter: `hue-rotate(${logoColor}deg)` }}
                className="[&>svg]:w-6 [&>svg]:h-6"
              />
            </SelectPrimitive.Trigger>
            <SelectContent className="border-border">
              {LOGO_ICONS.map((icon) => (
                <SelectItem key={icon.id} value={icon.id}>
                  <span className="flex items-center gap-3">
                    <div
                      dangerouslySetInnerHTML={{ __html: icon.lightSvg }}
                      style={{ filter: `hue-rotate(${logoColor}deg)` }}
                      className="[&>svg]:w-6 [&>svg]:h-6"
                    />
                    <span>
                      <span className="block font-medium text-gray-900 dark:text-gray-100">
                        {icon.name}
                      </span>
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* SVG Code Editor Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 shrink-0"
                type="button"
                aria-label="Edit SVG code"
              >
                <Code className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[500px] max-w-[calc(100vw-2rem)]" align="start">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Edit SVG Code</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Edit the SVG code directly. Changes will be reflected in the icon preview.
                  </p>
                </div>
                <Textarea
                  value={logoIcon}
                  onChange={(e) => setLogoIcon(e.target.value)}
                  className="font-mono text-xs min-h-[300px]"
                  placeholder="<svg>...</svg>"
                />
                <div className="flex items-center gap-2">
                  <div className="text-sm text-muted-foreground">Preview:</div>
                  <div
                    dangerouslySetInnerHTML={{ __html: logoIcon }}
                    style={{ filter: `hue-rotate(${logoColor}deg)` }}
                    className="[&>svg]:w-8 [&>svg]:h-8 flex items-center justify-center p-2 border rounded"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Logo Color Selector */}
      <div>
        <Label>Logo Color</Label>
        <div className="mt-2">
          <Select
            value={logoColor}
            onValueChange={(value) => setLogoColor(value)}
          >
            <SelectPrimitive.Trigger
              aria-label="Logo color"
              className={cn(
                'flex h-12 w-12 shrink-0 rounded-lg border border-input bg-background focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 p-0 overflow-hidden items-center justify-center'
              )}
            >
              <SelectValue>
                <div
                  className="w-6 h-6 rounded-full"
                  style={{
                    background: `hsl(${(240 + parseInt(logoColor)) % 360}, 70%, 50%)`
                  }}
                />
              </SelectValue>
            </SelectPrimitive.Trigger>
            <SelectContent className="border-border">
              <div className="grid grid-cols-4 gap-2 p-2">
                {HUE_PRESETS.map((preset) => (
                  <SelectItem
                    key={preset.value}
                    value={preset.value.toString()}
                    className="cursor-pointer p-0 h-12 w-12 flex items-center justify-center [&>span:first-child]:hidden"
                  >
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{
                        background: `hsl(${(240 + preset.value) % 360}, 70%, 50%)`
                      }}
                    />
                  </SelectItem>
                ))}
              </div>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tagline */}
      <div>
        <Label htmlFor="store-tagline">Tagline</Label>
        <Input
          id="store-tagline"
          value={tagline}
          maxLength={200}
          onChange={(e) => setTagline(e.target.value)}
          className="mt-2"
        />
      </div>

      {/* Contact */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <Label htmlFor="support-email">Support Email</Label>
          <Input
            id="support-email"
            type="email"
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="support-phone">Support Phone</Label>
          <Input
            id="support-phone"
            type="tel"
            value={supportPhone}
            onChange={(e) => setSupportPhone(e.target.value)}
            className="mt-2"
          />
        </div>
      </div>

      <Button onClick={handleSave} disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save Settings'}
      </Button>
    </div>
  );
}

export function StoreSettingsPageClient({
  initialData,
  initialError,
}: StoreSettingsPageClientProps) {
  const [storeId, setStoreId] = useState(initialData[0]?.id || '');

  if (initialError) {
    return (
      <div className="p-6">
        <div className="text-red-500">Error: {initialError}</div>
      </div>
    );
  }

  const store = initialData.find((entry) => entry.id === storeId);

  if (!store) {
    return (
      <div className="p-6 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">Store Settings</h1>
        <div className="flex flex-col items-center rounded-xl border border-dashed p-10 text-center">
          <Store className="size-8 text-muted-foreground" />
          <h2 className="mt-4 font-semibold">No store yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Set up your pharmacy to configure its name, logo, and contact details.
          </p>
          <Button asChild className="mt-6">
            <Link href="/dashboard">Get started</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Store Settings</h1>

      {initialData.length > 1 && (
        <div className="mb-6">
          <Label>Store</Label>
          <Select value={storeId} onValueChange={setStoreId}>
            <SelectTrigger className="mt-2" aria-label="Store">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {initialData.map((entry) => (
                <SelectItem key={entry.id} value={entry.id}>
                  {entry.operatorDisplayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <StoreSettingsForm key={store.id} store={store} />
    </div>
  );
}
