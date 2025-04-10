// netlify.config.mjs
export default {
  plugins: [
    {
      package: '@netlify/plugin-nextjs',
      config: {
        // Enable forms
        forms: true
      }
    }
  ]
}; 