import { factories } from '@strapi/strapi';
import axios from 'axios';
import crypto from 'crypto';


export default factories.createCoreController('api::classroom.classroom', ({ strapi }) => ({
  async getAssignments(ctx) {
    try {
      const response = await axios.get('https://api.github.com/user/repos', {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
        },
      });
      ctx.send(response.data);
    } catch (err) {
      ctx.badRequest('Failed to fetch assignments');
    }
  },

   async webhook(ctx) {
      try {
        const signature = ctx.request.headers['x-hub-signature-256'];
        const secret = process.env.GITHUB_WEBHOOK_SECRET;
  
        if (!secret) {
          return ctx.forbidden('Webhook secret not configured.');
        }
  
        const body = JSON.stringify(ctx.request.body);
        const computedSignature = `sha256=${crypto
          .createHmac('sha256', secret)
          .update(body)
          .digest('hex')}`;
  
        if (signature !== computedSignature) {
          return ctx.forbidden('Invalid webhook signature.');
        }
  
        const event = ctx.request.headers['x-github-event'];
  
        if (event === 'repository' && ctx.request.body.action === 'created') {
          const { repository, sender } = ctx.request.body;
  
          // Create a record in the classroom collection
          await strapi.entityService.create('api::classroom.classroom', {
            data: {
              Name: repository.name,
              GitHub_Repo_URL: repository.html_url,
              Description: repository.description || '',
              assignment_name: repository.name,
              user_name: sender.login,
              user_status: 'accepted',
            },
          });
        }
  
        ctx.send({ message: 'Webhook processed successfully' });
      } catch (error) {
        strapi.log.error('Error processing GitHub webhook:', error);
        ctx.badRequest('Webhook processing failed');
      }
    },
    
  async getAcceptedAssignments(ctx) {
    try {
      const orgName = 'creamcollar-Edtech'; // Replace with your GitHub Classroom organization
      const token = process.env.GITHUB_TOKEN;
  
      // Step 1: Fetch all repositories
      const reposResponse = await axios.get(`https://api.github.com/user/repos`, {
        headers: {
          Authorization: `token ${token}`,
        },
      });
  
      const repos = reposResponse.data;
  
      // Step 2: Fetch user data for each repository
      const acceptedData = await Promise.all(
        repos.map(async (repo) => {
          const collaboratorsResponse = await axios.get(
            `https://api.github.com/repos/${orgName}/${repo.name}/collaborators`,
            {
              headers: {
                Authorization: `token ${token}`,
              },
            }
          );
  
          return collaboratorsResponse.data.map((user) => ({
            assignment_name: repo.name,
            user_name: user.login,
            github_repo_url: repo.html_url,
            user_status: 'accepted', // Assuming all collaborators are "accepted"
          }));
        })
      );
  
      // Flatten the array of accepted data
      const flattenedData = acceptedData.flat();
  
      // Send the accepted user data
      ctx.send(flattenedData);
    } catch (err) {
      strapi.log.error('Error fetching accepted user data:', err);
      ctx.badRequest('Failed to fetch accepted user data');
    }
  }
  
}));
