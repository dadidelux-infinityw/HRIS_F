type AppSplashScreenProps = {
  isVisible: boolean;
};

function AppSplashScreen({ isVisible }: AppSplashScreenProps) {
  return (
    <div
      className={`app-splash-screen ${isVisible ? 'is-visible' : 'is-hidden'}`}
      aria-hidden={!isVisible}
    >
      <div className="app-splash-screen__backdrop" />
      <div className="app-splash-screen__content">
        <div className="app-splash-screen__brand-lockup">
          <div className="app-splash-screen__logo-wrap">
            <img
              src="/branding/nu-logo.png"
              alt="National University"
              className="app-splash-screen__logo"
            />
          </div>

          <div className="app-splash-screen__copy">
            <p className="app-splash-screen__eyebrow">National University</p>
            <h1 className="app-splash-screen__title">HRIS Portal</h1>
            <p className="app-splash-screen__subtitle">
              Preparing your recruitment workspace.
            </p>
          </div>
        </div>

        <div
          className="app-splash-screen__progress"
          role="status"
          aria-live="polite"
        >
          <span className="app-splash-screen__progress-bar" />
        </div>
      </div>
    </div>
  );
}

export default AppSplashScreen;
