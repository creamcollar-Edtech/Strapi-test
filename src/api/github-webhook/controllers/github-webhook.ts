import { Context } from 'koa';
import fs from 'fs';

interface Commit {
  message: string;
  timestamp: string;
  author: {
    email: string;
  };
}

interface Repository {
  name: string;
  created_at: string;
}

interface Pusher {
  email: string;
}

module.exports = {
  async webhook(ctx: Context) {
    const logFile = __dirname + '/process_payload.log';
    const { commits, repository, pusher } = ctx.request.body;

    // Log the start of processing
    fs.appendFileSync(logFile, `Processing webhook triggered at ${new Date()}\n`);

    // Validate the payload structure
    if (!commits || !repository || !pusher) {
      fs.appendFileSync(logFile, "Invalid payload structure.\n");
      return ctx.throw(400, 'Invalid payload structure');
    }

    const repositoryName: string = repository.name;
    const parts = repositoryName.split('-');
    const userGitAccountName = parts.pop();
    const assignmentName = parts.join('-');

    // Log payload for debugging
    fs.appendFileSync(logFile, "Payload loaded for processing.\n");

    // Check if the repository already exists in Strapi
    const existingRecord = await strapi.services['github-webhook'].findOne({ repository_name: repositoryName });

    if (!existingRecord) {
      // Insert new record into Strapi
      const data = {
        user_email: userGitAccountName,
        repository_name: repositoryName,
        assignment_name: assignmentName,
        accepted_status: 1,
        acceptance_date: new Date(repository.created_at),
        commit_message: null,
        commit_timestamp: null,
        submission_status: 0,
      };

      try {
        await strapi.services['github-webhook'].create(data);
        fs.appendFileSync(logFile, `Data inserted for repository: ${repositoryName}\n`);
      } catch (error) {
        fs.appendFileSync(logFile, `Failed to insert data: ${error.message}\n`);
      }
    } else {
      // Repository exists, now process commits
      if (commits && commits.length > 0) {
        commits.forEach(async (commit: Commit) => {
          const updatedData = {
            commit_message: commit.message,
            commit_timestamp: new Date(commit.timestamp),
            user_email: commit.author.email || userGitAccountName,  // Update email if available
            submission_status: 1,  // Mark as submitted
          };

          try {
            await strapi.services['github-webhook'].update({ id: existingRecord.id }, updatedData);
            fs.appendFileSync(logFile, `Commit data updated for repository: ${repositoryName}\n`);
          } catch (error) {
            fs.appendFileSync(logFile, `Failed to update commit data: ${error.message}\n`);
          }
        });
      }
    }

    // Send response back to GitHub
    ctx.send({ message: 'Data processed successfully' });
  },
};
