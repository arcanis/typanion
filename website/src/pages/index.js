import Link                 from '@docusaurus/Link';
import useBaseUrl           from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout               from '@theme/Layout';
import clsx                 from 'clsx';
import React                from 'react';

import styles               from './styles.module.css';

if (!window.location.pathname.endsWith(`/`))
  window.history.replaceState(null, null, `${window.location.ref}/`);

const features = [{
  title: `TypeScript integration`,
  description: `Typanion provides strong type inference; if your validator functions pass, TypeScript will refine values accordingly.`,
}, {
  title: `Feature complete`,
  description: `Despite being very small, Typanion supports error messages, coercions, and various utilities outside of pure JSON validation.`,
}, {
  title: `Tree-shakeable`,
  description: `Typanion uses a functional approach that lends itself very well to being optimized away by most bundlers.`,
}];

function Feature({imageUrl, title, description}) {
  const imgUrl = useBaseUrl(imageUrl);
  return (
    <div className={clsx(`col col--4`, styles.feature)}>
      {imgUrl && (
        <div className="text--center">
          <img className={styles.featureImage} src={imgUrl} alt={title} />
        </div>
      )}
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function Home() {
  const context = useDocusaurusContext();
  const {siteConfig = {}} = context;

  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline}>
      <header className={clsx(`hero hero--primary`, styles.heroBanner)}>
        <div className={`container`}>
          <h1 className={`hero__title`}>{siteConfig.title}</h1>
          <p className={`hero__subtitle`}>{siteConfig.tagline}</p>
          <div className={styles.buttons}>
            <Link className={clsx(`button button--outline button--secondary button--lg`, styles.getStarted)} to={useBaseUrl(`docs/`)}>
              Get Started
            </Link>
          </div>
        </div>
      </header>
      <main>
        {features && features.length > 0 && (
          <section className={styles.features}>
            <div className={`container`}>
              <div className={`row`}>
                {features.map((props, idx) => (
                  <Feature key={idx} {...props} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </Layout>
  );
}

// eslint-disable-next-line arca/no-default-export
export default Home;
