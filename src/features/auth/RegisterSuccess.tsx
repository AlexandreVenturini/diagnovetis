import { BrandMark } from '../../components/common/BrandMark'

export function RegisterSuccess({ email, onBack }: { email: string; onBack: () => void }) {
  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="register-title">
        <header className="login-brand">
          <BrandMark />
          <h1 id="register-title">DiagnoVetis</h1>
          <p className="brand-subtitle">Cadastro realizado!</p>
        </header>
        <div className="register-success">
          <p>
            Enviamos um e-mail de confirmação para <strong>{email}</strong>.<br />
            Acesse o link no e-mail para confirmar seu endereço.
          </p>
          <p className="register-success-note">Não encontrou? Verifique também a caixa de spam ou lixo eletrônico.</p>
          <p className="register-success-note register-success-note--last">
            Depois da confirmação, seu cadastro ainda precisa ser aprovado por um administrador para liberar o acesso.
          </p>
          <button className="submit-button" onClick={onBack}>
            Voltar para o login
          </button>
        </div>
      </section>
    </main>
  )
}
