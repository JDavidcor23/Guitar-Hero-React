import guitaristBg from '../../../../assets/game-menu/guy_gutar_background.png'

/** Hero banner with guitarist background image */
export const HeroSection = () => (
  <div className="game-menu__hero">
    <div
      className="game-menu__hero-bg"
      style={{ backgroundImage: `url(${guitaristBg})` }}
    />
    <div className="game-menu__hero-overlay" />
    <div className="game-menu__hero-content">
      <h1 className="game-menu__title">SONG SELECTION</h1>
      <p className="game-menu__subtitle">Choose your song and get ready to rock</p>
    </div>
  </div>
)
