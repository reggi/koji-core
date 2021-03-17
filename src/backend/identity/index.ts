import axios from 'axios';
import { server } from '../@decorators/server';
import { Base, BackendConfigurationInput } from '../base';
import { UserToken } from '../../types';

/**
 * API routes for auth methods.
 */
export enum AuthRoutes {
  GET_GRANT = '/v1/apps/auth/consumer/getGrantForToken',
  GET_ROLE = '/v1/apps/auth/consumer/getRoleForToken',
  PUSH_NOTIFICATION = '/v1/apps/auth/consumer/pushNotification',
}

/**
 * Possible values for a user's role within a Koji.
 */
export enum UserRole {
  ADMIN = 'admin',
  UNKNOWN = 'unknown',
  USER = 'user',
}

/**
 * Defines an interface for a user.
 */
export interface User {
  id: string | null;
  attributes: { [index: string]: any } | null;
  dateCreated: string | null;
  grants: {
    pushNotificationsEnabled: boolean;
  } | null;
  role: UserRole | null;
}

/**
 * Defines a notification to send to a user’s Koji account. Send notifications with [[pushNotificationToOwner]], for the user who created the Koji, or [[pushNotificationToUser]], for a user who interacts with the Koji and has granted the appropriate authorization.
 */
export interface PushNotification {
  /** Headline for the message. For example, the name of the Koji that generated the notification. */
  appName: string;
  /**  Icon to display next to the message, either the URL of an image or an emoji character. */
  icon: string;
  /** Content of the message. */
  message: string;
  /** Query parameters to append to the Koji URL when the notification is tapped. For example, load the admin experience or a dynamic receipt from the notification. */
  ref?: string;
}

/**
 * Implements an Identity class for backend authentication of your Koji.
 */
export class Identity extends Base {
  private rootPath: string;
  private rootHeaders: Object;

  /**
   * @param   config
   *
   * @example
   * ```javascript
   * const identity = new KojiBackend.Identity({ res });
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
   * Sends a notification to a user
   *
   * @param     userId            User id.
   * @param     notification      Notification to send to user.
   * @return                      Data object.
   *
   * @example
   * ```javascript
   * identity.pushNotificationToUser(id, notification);
   * ```
   */
  @server
  public async pushNotificationToUser(userId: string, notification: PushNotification): Promise<void> {
    const { data } = await axios.post(
      `${this.rootPath}${AuthRoutes.PUSH_NOTIFICATION}`,
      {
        destination: userId,
        notification,
      },
      { headers: this.rootHeaders },
    );

    return data;
  }

  /**
   * Sends a notification to the owner
   *
   * @param     notification      Notification to send to owner.
   * @return                      Data object.
   *
   * @example
   * ```javascript
   * identity.pushNotificationToUser(id, notification);
   * ```
   */
  @server
  public async pushNotificationToOwner(notification: PushNotification): Promise<void> {
    const { data } = await axios.post(
      `${this.rootPath}${AuthRoutes.PUSH_NOTIFICATION}`,
      {
        destination: 'owner',
        notification,
      },
      { headers: this.rootHeaders },
    );

    return data;
  }

  /**
   * Gets user by token
   *
   * @param     token      User token.
   * @return               User.
   *
   * @example
   * ```javascript
   * const user = identity.resolveUserFromToken(token);
   * ```
   */
  @server
  public async resolveUserFromToken(token: UserToken): Promise<User> {
    const data = await axios.all([
      axios.post(
        `${this.rootPath}${AuthRoutes.GET_ROLE}`,
        {},
        {
          headers: {
            ...this.rootHeaders,
            'X-Koji-Auth-Callback-Token': token,
          },
        },
      ),
      axios.post(
        `${this.rootPath}${AuthRoutes.GET_GRANT}`,
        {},
        {
          headers: {
            ...this.rootHeaders,
            'X-Koji-Auth-Callback-Token': token,
          },
        },
      ),
    ]);

    const [{ data: { role } }, { data: { grant } }] = data;

    // If the user hasn't granted any permissions, the only thing
    // we return is the role.
    if (!grant) {
      return {
        id: null,
        attributes: null,
        dateCreated: null,
        grants: null,
        role,
      };
    }

    // If the user has made a grant, we can look for specific attributes
    // and properties from the grant declaration.
    return {
      id: grant.userId,
      attributes: grant.attributes,
      dateCreated: grant.dateCreated,
      grants: {
        pushNotificationsEnabled: grant.pushNotificationsEnabled,
      },
      role,
    };
  }
}
