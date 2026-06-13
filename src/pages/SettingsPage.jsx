import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings, Globe, Bell, Shield, Palette, Database, Save,
  Check, AlertCircle, RefreshCw, Loader2
} from 'lucide-react';
import { adminGetSettings, adminUpdateSettings, adminFlushCache } from '../api/client';

function SettingSection({ icon: Icon, title, description, color, children }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      marginBottom: 16,
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '20px 24px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          width: 40, height: 40,
          background: (color || 'var(--accent)') + '15',
          borderRadius: 'var(--radius)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={18} color={color || 'var(--accent)'} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{description}</div>
        </div>
      </div>
      <div style={{ padding: '20px 24px' }}>
        {children}
      </div>
    </div>
  );
}

function SettingRow({ label, description, children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      padding: '12px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ flex: '1 1 200px', paddingRight: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{label}</div>
        {description && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{description}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function ToggleSwitch({ checked, onChange }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 42, height: 24, borderRadius: 99,
        background: checked ? 'var(--accent)' : 'var(--bg-elevated)',
        border: '1px solid ' + (checked ? 'var(--accent)' : 'var(--border)'),
        cursor: 'pointer', transition: 'all 0.2s ease',
        position: 'relative', flexShrink: 0,
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: '50%',
        background: checked ? '#000' : 'var(--text-muted)',
        position: 'absolute', top: 2,
        left: checked ? 20 : 2,
        transition: 'left 0.2s ease',
      }} />
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    siteName: 'StreamVault',
    siteUrl: 'http://localhost:5173',
    allowRegistration: true,
    requireEmailVerification: false,
    enableNotifications: true,
    enableAnalytics: true,
    maintenanceMode: false,
    enableCaching: true,
    cacheDuration: '5',
    maxUploadSize: '100',
    enableCloudinary: true,
    darkMode: true,
    accentColor: '#f5c518',
    autoPlay: true,
    showThumbnails: true,
  });

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [cacheMsg, setCacheMsg] = useState('');

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminGetSettings();
      if (res?.data) setSettings(prev => ({ ...prev, ...res.data }));
    } catch (err) {
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await adminUpdateSettings(settings);
      if (res?.data) setSettings(prev => ({ ...prev, ...res.data }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleClearCache = async () => {
    try {
      await adminFlushCache();
      setCacheMsg('Cache cleared successfully');
      setTimeout(() => setCacheMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to clear cache');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300, gap: 12 }}>
        <Loader2 size={24} style={{ color: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading settings...</span>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 28,
            letterSpacing: '0.06em', marginBottom: 4,
            color: 'var(--text-primary)',
          }}>
            SYSTEM <span style={{ color: 'var(--accent)' }}>SETTINGS</span>
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Configure your platform preferences and system options
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 18px',
            background: saved ? 'var(--green)' : 'var(--accent)',
            color: '#000',
            borderRadius: 'var(--radius)',
            fontSize: 12, fontWeight: 700,
            border: 'none', cursor: saving ? 'wait' : 'pointer',
            transition: 'all 0.2s ease',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saved ? <Check size={14} /> : <Save size={14} />}
          {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 16px', marginBottom: 16,
          background: 'var(--red-dim)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 'var(--radius)',
          fontSize: 12, color: 'var(--red)',
        }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {cacheMsg && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 16px', marginBottom: 16,
          background: 'var(--green-dim)',
          border: '1px solid rgba(34,197,94,0.2)',
          borderRadius: 'var(--radius)',
          fontSize: 12, color: 'var(--green)',
        }}>
          <Check size={14} /> {cacheMsg}
        </div>
      )}

      {/* Success message */}
      {saved && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 16px',
          background: 'var(--green-dim)',
          border: '1px solid rgba(34,197,94,0.2)',
          borderRadius: 'var(--radius)',
          marginBottom: 20,
          fontSize: 12, color: 'var(--green)',
          fontWeight: 600,
        }}>
          <Check size={14} />
          Settings saved successfully!
        </div>
      )}

      {/* General Settings */}
      <SettingSection icon={Globe} title="General" description="Basic platform configuration" color="#3b82f6">
        <SettingRow label="Site Name" description="The name of your platform">
          <input
            value={settings.siteName}
            onChange={(e) => updateSetting('siteName', e.target.value)}
            style={{ width: 220, height: 36, fontSize: 12 }}
          />
        </SettingRow>
        <SettingRow label="Site URL" description="The base URL of your platform">
          <input
            value={settings.siteUrl}
            onChange={(e) => updateSetting('siteUrl', e.target.value)}
            style={{ width: 220, height: 36, fontSize: 12 }}
          />
        </SettingRow>
        <SettingRow label="Maintenance Mode" description="Temporarily disable public access">
          <ToggleSwitch
            checked={settings.maintenanceMode}
            onChange={(v) => updateSetting('maintenanceMode', v)}
          />
        </SettingRow>
      </SettingSection>

      {/* User Settings */}
      <SettingSection icon={Shield} title="Users & Authentication" description="User registration and access controls" color="#22c55e">
        <SettingRow label="Allow Registration" description="Allow new users to register accounts">
          <ToggleSwitch
            checked={settings.allowRegistration}
            onChange={(v) => updateSetting('allowRegistration', v)}
          />
        </SettingRow>
        <SettingRow label="Email Verification" description="Require email verification for new accounts">
          <ToggleSwitch
            checked={settings.requireEmailVerification}
            onChange={(v) => updateSetting('requireEmailVerification', v)}
          />
        </SettingRow>
      </SettingSection>

      {/* Notifications */}
      <SettingSection icon={Bell} title="Notifications" description="Configure notification preferences" color="#f97316">
        <SettingRow label="Enable Notifications" description="Show notification bell to users">
          <ToggleSwitch
            checked={settings.enableNotifications}
            onChange={(v) => updateSetting('enableNotifications', v)}
          />
        </SettingRow>
        <SettingRow label="Enable Analytics" description="Collect platform usage analytics">
          <ToggleSwitch
            checked={settings.enableAnalytics}
            onChange={(v) => updateSetting('enableAnalytics', v)}
          />
        </SettingRow>
      </SettingSection>

      {/* Appearance */}
      <SettingSection icon={Palette} title="Appearance" description="Customize the look and feel" color="#8b5cf6">
        <SettingRow label="Dark Mode" description="Use dark theme across the platform">
          <ToggleSwitch
            checked={settings.darkMode}
            onChange={(v) => updateSetting('darkMode', v)}
          />
        </SettingRow>
        <SettingRow label="Auto-play Videos" description="Automatically play videos on page load">
          <ToggleSwitch
            checked={settings.autoPlay}
            onChange={(v) => updateSetting('autoPlay', v)}
          />
        </SettingRow>
        <SettingRow label="Show Thumbnails" description="Display content thumbnails in listings">
          <ToggleSwitch
            checked={settings.showThumbnails}
            onChange={(v) => updateSetting('showThumbnails', v)}
          />
        </SettingRow>
      </SettingSection>

      {/* Performance */}
      <SettingSection icon={Database} title="Performance" description="Caching and storage settings" color="#06b6d4">
        <SettingRow label="Enable Caching" description="Cache API responses for faster load times">
          <ToggleSwitch
            checked={settings.enableCaching}
            onChange={(v) => updateSetting('enableCaching', v)}
          />
        </SettingRow>
        <SettingRow label="Cache Duration (minutes)" description="How long to cache responses">
          <input
            value={settings.cacheDuration}
            onChange={(e) => updateSetting('cacheDuration', e.target.value)}
            style={{ width: 80, height: 36, fontSize: 12, textAlign: 'center' }}
            type="number"
            min="1"
            max="60"
          />
        </SettingRow>
        <SettingRow label="Max Upload Size (MB)" description="Maximum file upload size">
          <input
            value={settings.maxUploadSize}
            onChange={(e) => updateSetting('maxUploadSize', e.target.value)}
            style={{ width: 80, height: 36, fontSize: 12, textAlign: 'center' }}
            type="number"
            min="10"
            max="500"
          />
        </SettingRow>
        <SettingRow label="Cloudinary Integration" description="Use Cloudinary for media storage">
          <ToggleSwitch
            checked={settings.enableCloudinary}
            onChange={(v) => updateSetting('enableCloudinary', v)}
          />
        </SettingRow>
      </SettingSection>

      {/* Danger Zone */}
      <SettingSection icon={AlertCircle} title="Danger Zone" description="Irreversible actions" color="#ef4444">
        <SettingRow label="Clear Cache" description="Remove all cached API responses from the server">
          <button
            type="button"
            onClick={handleClearCache}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              color: 'var(--text-secondary)',
              fontSize: 11, fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={12} /> Clear Cache
          </button>
        </SettingRow>
      </SettingSection>
    </div>
  );
}