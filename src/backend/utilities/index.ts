import axios from 'axios';
import { server } from '../@decorators/server';
import { Base, BackendConfigurationInput } from '../base';

/**
 * API routes for utilities.
 */
enum UtilitiesRoutes {
  UNFREEZE_KEY = '/v1/apps/hooks/cache/unfreeze',
}

/**
 * Implements a class for handling secret values in your Koji.
 */
export class Utilities extends Base {
  private rootPath: string;
  private rootHeaders: Object;

  /**
   * @param   config
   *
   * @example
   * ```javascript
   * const utilities = new KojiBackend.Utilities({ res });
   * ```
   */
  public constructor(config: BackendConfigurationInput) {
    super(config);

    this.rootPath = 'https://rest.api.gokoji.com';

    this.rootHeaders = {
      'X-Koji-Project-Id': this.projectId,
      'X-Koji-Project-Token': this.projectToken,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Unfreeze a response that has been frozen by an `x-koji-freeze-key` header.
   *
   * @param   key      The key used to free the response
   *
   * @example
   * ```javascript
   * app.get('/loadPosts', async (req, res) => {
   *    const posts = [{ value: 'postValue' }];
   *
   *    res.setHeader('x-koji-freeze-key', 'posts');
   *    res.status(200).json({
   *        posts,
   *    });
   * });
   *
   * app.post('/update', async (req, res) => {
   *    // Update some data in the database
   *    // await db.update....
   *
   *    // Unfreeze. The next request to /loadPosts will hit the server and get
   *    // a fresh list of posts, which will then be frozen until unfreeze is
   *    // called again.
   *    await utilities.unfreeze('posts');
   *
   *    res.sendStatus(200);
   * });
   * ```
   */
  @server
  public async unfreeze(key: string): Promise<void> {
    await axios.post(
      `${this.rootPath}${UtilitiesRoutes.UNFREEZE_KEY}`,
      {
        key,
      },
      {
        headers: this.rootHeaders,
      },
    );
  }
}
