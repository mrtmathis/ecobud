import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import Icon from './Icon.jsx';

// Phones get the portrait cut, wider screens the landscape one
const NARROW = '(max-width: 640px)';
const REDUCED = '(prefers-reduced-motion: reduce)';

function useMedia(query) {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const list = window.matchMedia(query);
    const update = () => setMatch(list.matches);
    list.addEventListener('change', update);
    return () => list.removeEventListener('change', update);
  }, [query]);
  return match;
}

// Looping tour of the app in the visitor's theme and language; it only loads and plays while on screen
export default function PromoVideo() {
  const { t, i18n } = useTranslation();
  const video = useRef(null);
  const narrow = useMedia(NARROW);
  const reduced = useMedia(REDUCED);
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);
  // Reduced motion starts paused; the visitor's own choice wins afterwards
  const [paused, setPaused] = useState(reduced);
  const skin = document.documentElement.dataset.skin || 'ticket';
  const lang = i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'fr';
  const name = `/video/promo-${skin}-${lang}-${narrow ? 'port' : 'land'}`;

  useEffect(() => {
    const el = video.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setNear(true);
        setVisible(entry.intersectionRatio >= 0.4);
      },
      { rootMargin: '200px 0px', threshold: [0, 0.4] },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = video.current;
    if (!near) return;
    if (visible && !paused) el.play().catch(() => setPaused(true));
    else el.pause();
  }, [near, visible, paused, name]);

  return (
    <section className="landing-video" aria-labelledby="video-title">
      <h2 id="video-title">{t('home.videoTitle')}</h2>
      <figure className={`video-frame${narrow ? ' portrait' : ''}`}>
        <div className="video-box">
          <video
            ref={video}
            src={near ? `${name}.mp4` : undefined}
            poster={`${name}.jpg`}
            muted
            loop
            playsInline
            preload="none"
            aria-describedby="video-caption"
          />
          <button type="button" className="video-toggle" onClick={() => setPaused((p) => !p)} aria-label={paused ? t('home.videoPlay') : t('home.videoPause')}>
            <Icon name={paused ? 'play' : 'pause'} size={20} />
          </button>
        </div>
        <figcaption id="video-caption">{t('home.videoCaption')}</figcaption>
      </figure>
      <Link to="/register" className="btn">
        {t('auth.register')}
      </Link>
    </section>
  );
}
