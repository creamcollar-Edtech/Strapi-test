module.exports = {
    /**
     * Retrieve data from GitHubWebhook table.
     * @param {Object} params
     * @returns {Promise<Object>} Data
     */
    async findOne(params: Record<string, any>) {
      // Corrected usage of strapi.db.query to use the model name directly
      return strapi.db.query('api::github-webhook.github-webhook').findOne({ where: params });
    },
  
    /**
     * Create a new entry in the GitHubWebhook table.
     * @param {Object} data
     * @returns {Promise<Object>} Created entry
     */
    async create(data: Record<string, any>) {
      return strapi.db.query('api::github-webhook.github-webhook').create({ data });
    },
  
    /**
     * Update an existing entry in the GitHubWebhook table.
     * @param {Object} params
     * @param {Object} data
     * @returns {Promise<Object>} Updated entry
     */
    async update(params: Record<string, any>, data: Record<string, any>) {
      return strapi.db.query('api::github-webhook.github-webhook').update({ where: params, data });
    },
  };
  