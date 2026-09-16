"use client"

import {
  useEffect,
  useState,
} from "react"

import {
  useRouter,
} from "next/navigation"

import {
  supabase,
} from "@/lib/supabase/client"

import VerloBrand from "@/components/VerloBrand"

const POST_LOGIN_NEXT_KEY =
  "verlo_post_login_next"

function safeNext(
  value: string | null
) {
  if (!value) {
    return "/mi-verlo"
  }

  if (
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return "/mi-verlo"
  }

  return value
}

const styles = `
  .login-page {
    --pink: #f2a8a9;
    --pink-dark: #c37986;
    --black: #050002;
    --soft: #f2ebec;
    --cream: #efefea;
    --blue: #74bedc;
    --yellow: #e7c776;

    min-height: 100vh;

    display: grid;
    place-items: center;

    padding:
      110px 20px 60px;

    background:
      radial-gradient(
        circle at 15% 18%,
        rgba(242, 168, 169, 0.5),
        transparent 28%
      ),
      radial-gradient(
        circle at 82% 26%,
        rgba(231, 199, 118, 0.26),
        transparent 24%
      ),
      radial-gradient(
        circle at 80% 84%,
        rgba(116, 190, 220, 0.2),
        transparent 28%
      ),
      var(--soft);

    color:
      var(--black);

    font-family:
      Inter,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
  }

  .login-page * {
    box-sizing:
      border-box;
  }

  .login-card {
    width:
      min(
        100%,
        560px
      );

    border-radius:
      42px;

    padding:
      42px;

    background:
      rgba(
        255,
        255,
        255,
        0.74
      );

    border:
      1px solid
      rgba(
        5,
        0,
        2,
        0.08
      );

    box-shadow:
      0 28px 80px
      rgba(
        5,
        0,
        2,
        0.08
      );

    backdrop-filter:
      blur(18px);
  }

  .eyebrow {
    width:
      fit-content;

    display:
      inline-flex;

    align-items:
      center;

    gap:
      8px;

    margin-top:
      34px;

    padding:
      8px 12px;

    border-radius:
      999px;

    background:
      rgba(
        255,
        255,
        255,
        0.7
      );

    border:
      1px solid
      rgba(
        5,
        0,
        2,
        0.08
      );

    color:
      rgba(
        5,
        0,
        2,
        0.64
      );

    font-size:
      13px;

    font-weight:
      900;
  }

  .dot {
    width:
      8px;

    height:
      8px;

    border-radius:
      999px;

    background:
      var(--pink-dark);

    box-shadow:
      0 0 0 5px
      rgba(
        195,
        121,
        134,
        0.14
      );
  }

  .login-title {
    margin:
      24px 0 0;

    font-size:
      clamp(
        52px,
        7vw,
        82px
      );

    line-height:
      0.9;

    letter-spacing:
      -0.085em;

    font-weight:
      950;
  }

  .login-title em {
    font-family:
      Georgia,
      "Times New Roman",
      serif;

    font-style:
      italic;

    font-weight:
      400;
  }

  .login-copy {
    margin:
      18px 0 0;

    color:
      rgba(
        5,
        0,
        2,
        0.64
      );

    line-height:
      1.5;

    font-size:
      17px;
  }

  .form {
    margin-top:
      32px;

    display:
      grid;

    gap:
      18px;
  }

  .field {
    display:
      grid;

    gap:
      8px;
  }

  .field label {
    padding-left:
      4px;

    font-size:
      13px;

    font-weight:
      950;

    color:
      rgba(
        5,
        0,
        2,
        0.72
      );
  }

  .input {
    width:
      100%;

    min-height:
      58px;

    padding:
      0 18px;

    border:
      1px solid
      rgba(
        5,
        0,
        2,
        0.12
      );

    border-radius:
      20px;

    background:
      rgba(
        255,
        255,
        255,
        0.88
      );

    color:
      var(--black);

    font-family:
      inherit;

    font-size:
      16px;

    outline:
      none;
  }

  .input:focus {
    border-color:
      var(--pink-dark);

    box-shadow:
      0 0 0 5px
      rgba(
        195,
        121,
        134,
        0.12
      );

    background:
      white;
  }

  .submit {
    min-height:
      58px;

    padding:
      0 24px;

    border-radius:
      999px;

    border:
      1px solid
      var(--black);

    background:
      var(--black);

    color:
      white;

    font-family:
      inherit;

    font-size:
      16px;

    font-weight:
      950;

    cursor:
      pointer;

    box-shadow:
      0 18px 45px
      rgba(
        5,
        0,
        2,
        0.18
      );
  }

  .submit:disabled {
    opacity:
      0.55;

    cursor:
      default;
  }

  .error,
  .info {
    margin:
      0;

    padding:
      14px 16px;

    border-radius:
      18px;

    font-size:
      14px;

    font-weight:
      800;

    line-height:
      1.45;
  }

  .error {
    background:
      rgba(
        195,
        121,
        134,
        0.14
      );

    color:
      #7f2435;
  }

  .info {
    background:
      rgba(
        116,
        190,
        220,
        0.16
      );

    color:
      #255a6d;
  }

  .help {
    margin:
      4px 0 0;

    color:
      rgba(
        5,
        0,
        2,
        0.46
      );

    font-size:
      13px;

    line-height:
      1.45;
  }

  @media (
    max-width: 560px
  ) {
    .login-page {
      padding:
        82px 16px 40px;
    }

    .login-card {
      padding:
        28px;

      border-radius:
        32px;
    }
  }
`

export default function LoginPage() {
  const router =
    useRouter()

  const [
    email,
    setEmail,
  ] =
    useState("")

  const [
    loading,
    setLoading,
  ] =
    useState(false)

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    )

  const [
    info,
    setInfo,
  ] =
    useState<string | null>(
      null
    )

  useEffect(
    () => {
      function getNext() {
        const params =
          new URLSearchParams(
            window.location.search
          )

        return safeNext(
          params.get(
            "next"
          ) ||
            window.localStorage.getItem(
              POST_LOGIN_NEXT_KEY
            )
        )
      }

      async function redirectIfLoggedIn() {
        const {
          data,
        } =
          await supabase
            .auth
            .getSession()

        if (
          !data.session
        ) {
          return
        }

        const next =
          getNext()

        window.localStorage.removeItem(
          POST_LOGIN_NEXT_KEY
        )

        router.replace(
          next
        )
      }

      redirectIfLoggedIn()

      const {
        data: {
          subscription,
        },
      } =
        supabase
          .auth
          .onAuthStateChange(
            (
              _event,
              session
            ) => {
              if (
                !session
              ) {
                return
              }

              const next =
                getNext()

              window.localStorage.removeItem(
                POST_LOGIN_NEXT_KEY
              )

              router.replace(
                next
              )
            }
          )

      return () => {
        subscription.unsubscribe()
      }
    },
    [
      router,
    ]
  )

  async function sendMagicLink(
    event:
      React.FormEvent
  ) {
    event.preventDefault()

    setLoading(
      true
    )

    setError(
      null
    )

    setInfo(
      null
    )

    try {
      const params =
        new URLSearchParams(
          window.location.search
        )

      const next =
        safeNext(
          params.get(
            "next"
          )
        )

      window.localStorage.setItem(
        POST_LOGIN_NEXT_KEY,
        next
      )

      const redirectTo =
        `${window.location.origin}/login?next=${encodeURIComponent(
          next
        )}`

      const {
        error:
          authError,
      } =
        await supabase
          .auth
          .signInWithOtp({
            email:
              email
                .trim()
                .toLowerCase(),

            options: {
              /*
               * Login normal:
               * NO creamos usuarios nuevos acá.
               *
               * El alta real ocurre desde el
               * formulario + /success.
               */
              shouldCreateUser:
                false,

              emailRedirectTo:
                redirectTo,
            },
          })

      if (
        authError
      ) {
        console.error(
          "login magic link error:",
          authError
        )

        throw authError
      }

      setInfo(
        "Te enviamos un enlace seguro por email. Abrilo para entrar a Mi Verlo. Si no lo ves, revisá Spam o Correo no deseado."
      )
    } catch (
      error
    ) {
      console.error(
        "login error:",
        error
      )

      setError(
        "No pudimos enviarte el acceso. Revisá que estés usando el mismo email con el que te registraste en Verlo."
      )
    } finally {
      setLoading(
        false
      )
    }
  }

  return (
    <>
      <style>
        {styles}
      </style>

      <main className="login-page">
        <section className="login-card">
          <VerloBrand
            width={104}
          />

          <div className="eyebrow">
            <span className="dot" />

            Acceso seguro
          </div>

          <h1 className="login-title">
            Entrá a{" "}
            <em>
              Mi Verlo.
            </em>
          </h1>

          <p className="login-copy">
            Usá el mismo email con el que
            cargaste tu búsqueda o propiedad.
            Te enviaremos un enlace seguro
            para entrar.
          </p>

          <form
            className="form"
            onSubmit={
              sendMagicLink
            }
          >
            <div className="field">
              <label
                htmlFor="email"
              >
                Email
              </label>

              <input
                id="email"
                className="input"
                type="email"
                autoComplete="email"
                placeholder="tu@email.com"
                value={
                  email
                }
                onChange={
                  event =>
                    setEmail(
                      event
                        .target
                        .value
                    )
                }
                required
              />
            </div>

            {error && (
              <p className="error">
                {error}
              </p>
            )}

            {info && (
              <p className="info">
                {info}
              </p>
            )}

            <button
              className="submit"
              type="submit"
              disabled={
                loading
              }
            >
              {loading
                ? "ENVIANDO ACCESO..."
                : "ENTRAR A MI VERLO"}
            </button>

            <p className="help">
              No necesitás contraseña.
            </p>
          </form>
        </section>
      </main>
    </>
  )
}
