import { useState, type ReactNode } from 'react';
import { Sparkles, Mail, Lock, User as UserIcon, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { navigate } from '@/router';

type Mode = 'login' | 'register';

const features = [
  "Matching intelligent entre votre profil et les offres d'emploi",
  "Analyse automatique de votre CV et détection de compétences",
  "Suivi de vos candidatures en un seul tableau de bord",
];

export function AuthPage({ mode }: { mode: Mode }) {
  const { login, register, loading, error } = useAuth();
  const [form, setForm] = useState({
    email: 'yasmine.benali@skillbridge.ai',
    password: 'demo1234',
    firstName: 'Yasmine',
    lastName: 'Benali',
  });
  const [localError, setLocalError] = useState<string | null>(null);

  const isLogin = mode === 'login';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        await register(form);
      }
      navigate('/dashboard');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    }
  };

  const field = (
    label: string,
    icon: ReactNode,
    key: keyof typeof form,
    type = 'text',
    placeholder?: string,
  ) => (
    <label className="block">
      <span className="text-sm font-medium text-navy-800">{label}</span>
      <div className="relative mt-1.5">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
        <input
          type={type}
          value={form[key]}
          placeholder={placeholder}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
        />
      </div>
    </label>
  );

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-navy-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-brand-950" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-12 w-80 h-80 bg-accent-600/20 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-xl shadow-brand-600/40">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg">SkillBridge AI</span>
              <span className="block text-xs text-navy-300 -mt-0.5">Votre pont vers la carrière</span>
            </div>
          </div>

          <div className="max-w-md">
            <h1 className="text-3xl xl:text-4xl font-bold leading-tight">
              Trouvez le stage PFE et l'emploi faits pour vous
            </h1>
            <p className="text-navy-200 mt-4 leading-relaxed">
              SkillBridge AI analyse votre CV, détecte vos compétences et vous
              propose les offres les plus pertinentes avec un score de
              correspondance.
            </p>
            <ul className="mt-8 space-y-3">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-navy-100">
                  <CheckCircle2 className="w-5 h-5 text-success-400 shrink-0 mt-0.5" />
                  <span className="text-sm">{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-navy-400">
            Prototypage — les prédictions de matching sont simulées à des fins de démonstration.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-navy-900 text-lg">SkillBridge AI</span>
          </div>

          <h2 className="text-2xl font-bold text-navy-900">
            {isLogin ? 'Connexion' : 'Créer un compte'}
          </h2>
          <p className="text-slate-500 mt-1 text-sm">
            {isLogin
              ? 'Accédez à votre tableau de bord personnalisé.'
              : "Rejoignez SkillBridge AI et boostez votre recherche d'emploi."}
          </p>

          {(localError || error) && (
            <div className="mt-5 rounded-xl bg-error-50 border border-error-200 text-error-700 text-sm px-4 py-3">
              {localError || error}
            </div>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-3">
                {field('Prénom', <UserIcon className="w-4 h-4" />, 'firstName')}
                {field('Nom', <UserIcon className="w-4 h-4" />, 'lastName')}
              </div>
            )}
            {field('Email', <Mail className="w-4 h-4" />, 'email', 'email', 'vous@exemple.com')}
            {field('Mot de passe', <Lock className="w-4 h-4" />, 'password', 'password', '••••••••')}

            <Button type="submit" size="lg" loading={loading} className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
              {isLogin ? 'Se connecter' : "S'inscrire"}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            {isLogin ? "Pas encore de compte ?" : 'Vous avez déjà un compte ?'}{' '}
            <button
              onClick={() => navigate(isLogin ? '/register' : '/login')}
              className="font-semibold text-brand-600 hover:text-brand-700"
            >
              {isLogin ? "S'inscrire" : 'Se connecter'}
            </button>
          </p>

          {isLogin && (
            <p className="text-center text-xs text-slate-400 mt-4">
              Démo : utilisez les identifiants pré-remplis pour vous connecter.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
