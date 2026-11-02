'use client';

import { useState } from 'react';
import { rxFontClass } from '@/features/storefront/lib/fonts';
import Link from 'next/link';
import { Code } from 'lucide-react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Callout, EmptyBand, Pill, RxButton, TitleLine, Track } from '@/features/platform/components/rx-ui';
import { storeBrandHue } from '@/features/storefront/lib/rx-brand';
import { cn } from '@/lib/utils';
import { LOGO_ICONS, HUE_PRESETS } from '../lib/icon-registry';
import { updateStoreSettings, type StoreLocationHours, type StoreSettings } from '../actions';
import { LocationHoursEditor } from '../components/LocationHoursEditor';
import { StoreSettingsSaveBar } from '../components/StoreSettingsSaveBar';

interface StoreSettingsPageClientProps {
  initialData: StoreSettings[];
  initialError: string | null;
  locations?: Record<string, StoreLocationHours[]>;
}

function Mark({ svg, hue, className }: { svg: string; hue: string; className?: string }) {
  return <span aria-hidden="true" className={cn('block shrink-0 [&>svg]:block [&>svg]:size-full', className)} style={{ filter: `hue-rotate(${hue}deg)` }} dangerouslySetInnerHTML={{ __html: svg }} />;
}

function StorefrontPreview({ name, tagline, logoIcon, logoColor, phone }: { name: string; tagline: string; logoIcon: string; logoColor: string; phone: string }) {
  const hue = storeBrandHue(logoColor);
  // The storefront's apothecary cabinet in miniature: ebonized ground, gold name, enamel-plated drawers.
  return <figure aria-label="Storefront preview" className={cn(rxFontClass, 'overflow-hidden rounded-[6px] border border-border text-[oklch(0.95_0.012_85)]')} style={{ background: `oklch(0.165 0.012 ${hue})` }}>
    <div className="flex items-center justify-between gap-3 border-b px-4 py-1.5 text-[12px] font-medium" style={{ background: `oklch(0.2 0.014 ${hue})`, borderColor: `oklch(0.33 0.014 ${hue})` }}>
      <span className="truncate">{name || 'Store name'}</span>
      {phone && <span className="tabular-nums">{phone}</span>}
    </div>
    <div className="flex items-center gap-2.5 px-4 py-3">
      <Mark svg={logoIcon} hue={logoColor} className="size-7" />
      <span className="truncate font-[family-name:var(--rx-font-display),Georgia,serif] text-[16px]">{name || 'Store name'}</span>
    </div>
    <div className="px-4 pb-4">
      <p className="font-[family-name:var(--rx-font-display),Georgia,serif] text-[28px] leading-none text-[oklch(0.77_0.095_82)]">{name || 'Store name'}</p>
      {tagline && <p className="mt-2 text-xs opacity-75">{tagline}</p>}
      <div className="mt-4 grid grid-cols-2 gap-1.5 rounded-[6px] p-1.5" style={{ background: `oklch(0.2 0.014 ${hue})` }}>
        {['Refill a prescription', 'Track an order'].map((label) => <span key={label} className="flex flex-col items-center gap-2 rounded-[4px] px-2 py-3" style={{ background: `oklch(0.235 0.016 ${hue})` }}>
          <span className="rounded-[3px] bg-[oklch(0.93_0.022_88)] px-2 py-0.5 text-[12px] font-bold text-[oklch(0.2_0.015_160)]">{label}</span>
          <span className="block h-1 w-7 rounded-[2px] bg-[oklch(0.7_0.085_80)]" />
        </span>)}
      </div>
    </div>
  </figure>;
}

function StoreSettingsForm({ store }: { store: StoreSettings }) {
  const [name, setName] = useState(store.operatorDisplayName || '');
  const [logoIcon, setLogoIcon] = useState(store.logoIcon || LOGO_ICONS[0].lightSvg);
  const [logoColor, setLogoColor] = useState(store.logoColor || '0');
  const [tagline, setTagline] = useState(store.operatorTagline || '');
  const [supportEmail, setSupportEmail] = useState(store.supportEmail || '');
  const [supportPhone, setSupportPhone] = useState(store.supportPhone || '');
  const [privacyNotice, setPrivacyNotice] = useState(store.privacyNotice || '');
  const [willCallReturnDays, setWillCallReturnDays] = useState(String(store.willCallReturnDays ?? 10));
  const [isLoading, setIsLoading] = useState(false);
  const [saved, setSaved] = useState<{ ok: boolean; text: string } | null>(null);

  const handleSave = async () => {
    setIsLoading(true);
    const result = await updateStoreSettings(store.id, {
      operatorDisplayName: name,
      operatorTagline: tagline,
      logoIcon,
      logoColor,
      supportEmail,
      supportPhone,
      privacyNotice,
      willCallReturnDays: Number(willCallReturnDays),
    });

    if (result.success) {
      toast.success('Store settings saved');
      setSaved({ ok: true, text: `Saved ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` });
    } else {
      toast.error(result.error || 'Store settings could not be saved');
      setSaved({ ok: false, text: result.error || 'Store settings could not be saved' });
    }
    setIsLoading(false);
  };

  const selectedIcon = LOGO_ICONS.find((icon) => icon.lightSvg === logoIcon);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <div className="space-y-5">
        <section className="space-y-4 rounded-[6px] bg-background p-4 border border-border sm:p-5">
          <h2 className="text-sm font-semibold">Store</h2>
          <div className="grid gap-2">
            <Label htmlFor="store-name">Store name</Label>
            <Input id="store-name" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="store-tagline">Tagline</Label>
            <Input id="store-tagline" value={tagline} maxLength={200} onChange={(e) => setTagline(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="support-email">Support email</Label>
              <Input id="support-email" type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="support-phone">Support phone</Label>
              <Input id="support-phone" type="tel" value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} />
            </div>
          </div>
        </section>

        <section className="space-y-6 rounded-[6px] bg-background p-4 border border-border sm:p-5">
          <h2 className="text-sm font-semibold">Logo</h2>
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
                <SelectContent className="border-border dark:border-blue-700">
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
                  >
                    <Code className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[min(500px,calc(100vw-2rem))]" align="start">
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
                <SelectContent className="border-border dark:border-blue-700">
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
        </section>

        <section className="space-y-3 rounded-[6px] bg-background p-4 border border-border sm:p-5">
          <h2 className="text-sm font-semibold">Will-call</h2>
          <div className="grid gap-2 sm:max-w-xs">
            <Label htmlFor="will-call-days">Return-to-stock review after (days)</Label>
            <Input id="will-call-days" inputMode="numeric" value={willCallReturnDays} onChange={(e) => setWillCallReturnDays(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))} />
          </div>
          <p className="text-sm text-muted-foreground">Filled prescriptions waiting longer than this are flagged in the prescription queue. Nothing is returned automatically; a pharmacist confirms each one.</p>
        </section>

        <section className="space-y-3 rounded-[6px] bg-background p-4 border border-border sm:p-5">
          <TitleLine as="h2" title="Notice of Privacy Practices" titleClassName="text-sm" tone={privacyNotice.trim() ? 'ok' : 'warn'} state={privacyNotice.trim() ? 'Posted at /privacy' : 'Not posted'} />
          <Label htmlFor="privacy-notice" className="sr-only">Notice of Privacy Practices</Label>
          <Textarea id="privacy-notice" value={privacyNotice} onChange={(e) => setPrivacyNotice(e.target.value)} maxLength={50000} className="min-h-48 text-sm" />
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <StoreSettingsSaveBar
            isSaving={isLoading}
            button={
              <RxButton onClick={() => { setSaved(null); handleSave(); }} disabled={isLoading} className="min-h-10 px-5">
                {isLoading ? 'Saving…' : 'Save settings'}
              </RxButton>
            }
          />
          {saved && <p role="status" className={saved.ok ? 'text-sm text-muted-foreground' : 'text-sm text-red-700 dark:text-red-300'}>{saved.text}</p>}
        </div>
      </div>

      <div className="space-y-2 lg:sticky lg:top-4">
        <h2 className="text-sm font-semibold">Storefront</h2>
        <StorefrontPreview name={name} tagline={tagline} logoIcon={logoIcon} logoColor={logoColor} phone={supportPhone} />
      </div>
    </div>
  );
}

export function StoreSettingsPageClient({
  initialData,
  initialError,
  locations,
}: StoreSettingsPageClientProps) {
  const [storeId, setStoreId] = useState(initialData[0]?.id || '');
  const store = initialData.find((entry) => entry.id === storeId);

  return (
    <div className="w-full max-w-5xl space-y-5 p-4 pb-24 md:p-6">
      <TitleLine title="Store settings" tone={store ? 'ok' : undefined} state={store ? store.operatorDisplayName : undefined} />
      {initialError
        ? <Callout tone="danger" title="Couldn't load store settings">{initialError}</Callout>
        : !store
          ? <EmptyBand action={<RxButton asChild><Link href="/dashboard">Set up the pharmacy</Link></RxButton>}>No store yet</EmptyBand>
          : <>
            {initialData.length > 1 && <Track label="Store">
              {initialData.map((entry) => <Pill key={entry.id} active={entry.id === storeId} onClick={() => setStoreId(entry.id)}>{entry.operatorDisplayName}</Pill>)}
            </Track>}
            <StoreSettingsForm key={store.id} store={store} />
            {locations?.[store.id]?.length ? <div className="grid gap-4 lg:max-w-[calc(100%-21.5rem)]">
              <h2 className="text-sm font-semibold">Hours</h2>
              {locations[store.id].map((location) => <LocationHoursEditor key={location.id} location={location} />)}
            </div> : null}
          </>}
    </div>
  );
}
