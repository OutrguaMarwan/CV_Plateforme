import { useState } from 'react';
import { User as UserIcon, Mail, Phone, MapPin, Lock, Bell, Shield, Save, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout, PageHeader } from '@/components/layout/DashboardLayout';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, ProgressBar } from '@/components/ui/Badge';

function Field({
  label,
  icon,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-navy-800">{label}</span>
      <div className="relative mt-1.5">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
        />
      </div>
    </label>
  );
}

function Toggle({ enabled, onChange, label, description }: { enabled: boolean; onChange: (v: boolean) => void; label: string; description: string }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-navy-800">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${enabled ? 'bg-brand-600' : 'bg-slate-300'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${enabled ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
    headline: user?.headline || '',
    bio: user?.bio || '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState({ email: true, push: false, weekly: true, matches: true });
  const [tab, setTab] = useState<'profile' | 'notifications' | 'security'>('profile');

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    await new Promise((r) => setTimeout(r, 600));
    updateUser(form);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const tabs = [
    { id: 'profile' as const, label: 'Profil', icon: UserIcon },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'security' as const, label: 'Sécurité', icon: Lock },
  ];

  const profileCompletion = 72;

  return (
    <DashboardLayout>
      <PageHeader title="Profil & réglages" subtitle="Gérez vos informations personnelles et préférences." />

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Profile summary */}
        <div className="lg:col-span-1">
          <Card className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar name={`${form.firstName} ${form.lastName}`} size={88} color="brand" />
            </div>
            <h3 className="font-semibold text-navy-900">{form.firstName} {form.lastName}</h3>
            <p className="text-sm text-slate-500 mt-0.5">{form.email}</p>
            {form.headline && <p className="text-xs text-slate-400 mt-2">{form.headline}</p>}
            <div className="mt-5 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">Complétion du profil</span>
                <span className="text-xs font-semibold text-brand-600">{profileCompletion}%</span>
              </div>
              <ProgressBar value={profileCompletion} tone="brand" />
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Badge tone="success" size="sm" dot>Compte vérifié</Badge>
              <Badge tone="brand" size="sm">Étudiant</Badge>
            </div>
          </Card>
        </div>

        {/* Settings */}
        <div className="lg:col-span-3">
          {/* Tabs */}
          <div className="flex gap-1 mb-5 bg-white rounded-xl border border-slate-200 p-1 shadow-card">
            {tabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 inline-flex items-center justify-center gap-2 text-sm font-medium py-2.5 rounded-lg transition-all ${
                    tab === t.id ? 'bg-navy-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" /> {t.label}
                </button>
              );
            })}
          </div>

          {tab === 'profile' && (
            <Card>
              <CardHeader title="Informations personnelles" subtitle="Mettez à jour vos données" icon={<UserIcon className="w-5 h-5" />} />
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Prénom" icon={<UserIcon className="w-4 h-4" />} value={form.firstName} onChange={(v) => setForm((f) => ({ ...f, firstName: v }))} />
                  <Field label="Nom" icon={<UserIcon className="w-4 h-4" />} value={form.lastName} onChange={(v) => setForm((f) => ({ ...f, lastName: v }))} />
                </div>
                <Field label="Email" icon={<Mail className="w-4 h-4" />} type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Téléphone" icon={<Phone className="w-4 h-4" />} value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} placeholder="+33 6 12 34 56 78" />
                  <Field label="Localisation" icon={<MapPin className="w-4 h-4" />} value={form.location} onChange={(v) => setForm((f) => ({ ...f, location: v }))} placeholder="Ville, Pays" />
                </div>
                <Field label="Titre / accroche" icon={<UserIcon className="w-4 h-4" />} value={form.headline} onChange={(v) => setForm((f) => ({ ...f, headline: v }))} placeholder="Ex: Étudiante en Master Informatique" />
                <label className="block">
                  <span className="text-sm font-medium text-navy-800">Bio</span>
                  <textarea
                    value={form.bio}
                    onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                    rows={4}
                    placeholder="Présentez-vous en quelques lignes…"
                    className="w-full mt-1.5 px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition-all resize-none"
                  />
                </label>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  {saved && (
                    <span className="text-sm text-success-600 flex items-center gap-1.5 animate-fade-in">
                      <CheckCircle2 className="w-4 h-4" /> Modifications enregistrées
                    </span>
                  )}
                  <Button onClick={handleSave} loading={saving} leftIcon={<Save className="w-4 h-4" />}>
                    Enregistrer
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {tab === 'notifications' && (
            <Card>
              <CardHeader title="Préférences de notifications" subtitle="Choisissez ce que vous voulez recevoir" icon={<Bell className="w-5 h-5" />} />
              <div className="divide-y divide-slate-100">
                <Toggle enabled={notifications.email} onChange={(v) => setNotifications((n) => ({ ...n, email: v }))} label="Notifications par email" description="Recevez les mises à jour par email" />
                <Toggle enabled={notifications.push} onChange={(v) => setNotifications((n) => ({ ...n, push: v }))} label="Notifications push" description="Alertes en temps réel sur votre navigateur" />
                <Toggle enabled={notifications.weekly} onChange={(v) => setNotifications((n) => ({ ...n, weekly: v }))} label="Récap hebdomadaire" description="Un résumé de votre activité chaque semaine" />
                <Toggle enabled={notifications.matches} onChange={(v) => setNotifications((n) => ({ ...n, matches: v }))} label="Nouvelles offres correspondantes" description="Soyez alerté quand une offre vous correspond" />
              </div>
            </Card>
          )}

          {tab === 'security' && (
            <Card>
              <CardHeader title="Sécurité du compte" subtitle="Protégez votre compte" icon={<Shield className="w-5 h-5" />} />
              <div className="space-y-4">
                <Field label="Mot de passe actuel" icon={<Lock className="w-4 h-4" />} type="password" value="" onChange={() => {}} placeholder="••••••••" />
                <Field label="Nouveau mot de passe" icon={<Lock className="w-4 h-4" />} type="password" value="" onChange={() => {}} placeholder="••••••••" />
                <Field label="Confirmer le mot de passe" icon={<Lock className="w-4 h-4" />} type="password" value="" onChange={() => {}} placeholder="••••••••" />
                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <Button variant="outline" leftIcon={<Shield className="w-4 h-4" />}>Mettre à jour le mot de passe</Button>
                </div>
                <div className="mt-2 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-500 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-500" />
                  L'authentification à deux facteurs sera disponible dans une prochaine version.
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
