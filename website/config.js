// @ts-check

module.exports = {
  name: `Typanion`,
  repository: `typanion`,
  description: `Type-safe runtime type validation with no dependencies`,
  algolia: `47075646ffba88bf3475b4b640843da6`,

  icon: {
    letter: `T`,
  },

  colors: {
    primary: `#70b1fc`,
  },

  sidebar: {
    General: [`overview`, `getting-started`, `examples`],
    Predicates: [`predicates/cascading`, `predicates/helpers`, `predicates/types`],
  },

  index: {
    getStarted: `/docs`,
    features: [{
      title: `TypeScript integration`,
      description: `Typanion provides strong type inference; if your validator functions pass, TypeScript will refine values accordingly.`,
    }, {
      title: `Feature complete`,
      description: `Despite being very small, Typanion supports error messages, coercions, and various utilities outside of pure JSON validation.`,
    }, {
      title: `Tree-shakeable`,
      description: `Typanion uses a functional approach that lends itself very well to being optimized away by most bundlers.`,
    }],
  },
};
