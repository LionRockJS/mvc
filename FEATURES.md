# Features

## Controller

The `Controller` class is the core component for handling requests and managing application state.

### Key Features:

- **State Management**: Uses a `Map` to store and manage the state of the request, response, and application context.
- **Action Execution**: Automatically routes requests to specific action methods (e.g., `action_index`, `action_show`) based on the `action` parameter.
- **Lifecycle Hooks**: Supports a defined lifecycle for request processing:
    1.  **Setup**: Initial setup phase.
    2.  **Before**: Pre-action logic.
    3.  **Action**: Execution of the main action logic.
    4.  **After**: Post-action logic.
- **Mixin Support**: Extensible via `ControllerMixin` to share logic across multiple controllers. Mixins hook into the controller's lifecycle.
- **Request Handling**:
    - Parses query parameters, body, headers, and cookies.
    - Detects client IP, user agent, and hostname.
    - Supports language detection from parameters or query strings.
- **Response Helpers**:
    - `redirect(location, keepQueryString)`: Redirects the client to a new URL.
    - `forbidden(msg)`: Returns a 403 Forbidden response.
    - `exit(code)`: Terminates the request processing with a specific status code.
- **Error Handling**: Built-in handling for 404 Not Found and 500 Internal Server Error.

### Controller State Enumerated Values

The `ControllerState` enum defines standard keys for accessing state information, categorized by their purpose:

#### Request Information
- `REQUEST`: The raw request object.
- `REQUEST_BODY`: The request body.
- `REQUEST_HEADERS`: The request headers.
- `REQUEST_COOKIES`: The request cookies.
- `QUERY`: The query parameters.
- `PARAMS`: The route parameters.
- `CLIENT_IP`: The client's IP address.
- `USER_AGENT`: The client's user agent.
- `HOSTNAME`: The hostname of the request.
- `LANGUAGE`: The detected language.
- `CHECKPOINT`: Checkpoint information.

#### Controller Internal State
- `CLIENT`: The controller instance.
- `ACTION`: The requested action name.
- `FULL_ACTION_NAME`: The full method name of the action (e.g., `action_index`).
- `EXITED`: Boolean flag indicating if the controller has exited.

#### Response Information
- `BODY`: The response body.
- `HEADERS`: The response headers.
- `COOKIES`: The response cookies.
- `STATUS`: The HTTP status code.

### Params vs Query

- **PARAMS (`ControllerState.PARAMS`)**: Represents parameters extracted from the URL path (e.g., `/users/:id`). These are typically defined by the routing system before reaching the controller.
- **QUERY (`ControllerState.QUERY`)**: Represents parameters extracted from the URL query string (e.g., `?sort=asc&page=2`).

**Example:**
For a URL `GET /products/123?details=true`:
- `PARAMS` might contain `{ id: '123' }` (depending on route definition).
- `QUERY` will contain `{ details: 'true' }`.

### Checkpoint Mechanism

The `CHECKPOINT` state is a built-in mechanism to capture a specific query parameter (`checkpoint` or `cp`) from the request URL. It is typically used to store a return URL or a continuation token.

**Usage:**

1.  **Pass via URL**: `?checkpoint=/dashboard` or `?cp=/dashboard`
2.  **Access in Controller**:
    ```typescript
    const checkpoint = this.state.get(ControllerState.CHECKPOINT);
    if (checkpoint) await this.redirect(checkpoint);
    ```

## ControllerMixin

`ControllerMixin` allows for modular code reuse and separation of concerns.

### Key Features:

- **Lifecycle Integration**: Mixins can implement static methods that correspond to the controller's lifecycle:
    - `init(state)`: Runs during controller initialization.
    - `setup(state)`: Runs before the `before` stage.
    - `before(state)`: Runs before the action.
    - `execute(fullActionName, state)`: Runs during the action stage, allowing mixins to handle specific actions.
    - `after(state)`: Runs after the action.
    - `exit(state)`: Runs when the controller exits.

### Controller Mixin vs Standard Middleware

| Feature | Controller Mixin (LionRockJS) | Standard Middleware |
| :--- | :--- | :--- |
| **Where is it defined?** | Inside `class MyController` (`static mixins`) | In App/Router config (`app.use(...)`) |
| **Execution Context** | Inside the Controller instance | Outside/Around the Controller |
| **Lifecycle Hooks** | `init`, `setup`, `before`, `execute`, `after`, `exit` | Usually just `handle` (Request -> Response) |
| **Data Sharing** | Shared `Map` (`this.state`) | `req`/`res` objects or Context |
| **Primary Use Case** | Reusing logic *specific to Controllers* (e.g., common page setup, shared actions) | Global request processing (e.g., Logging, CORS, Body Parsing) |

## View

The `View` class provides a simple structure for rendering responses.

### Key Features:

- **Factory Pattern**: Includes a `factory` method for creating view instances.
- **Data Binding**: Accepts a file path and a data object.
- **Render Method**: A `render` method that returns the data by default, intended to be overridden for specific rendering logic (e.g., template engines).
