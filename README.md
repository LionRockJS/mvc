# LionRockJS MVC
mvc is the core module for LionRockJS

## Controller
`Controller` is the main class for handling requests. It use `state` to store data and handle actions.

## ControllerMixin

A `ControllerMixin` is a class designed to extend the functionality of a `Controller` by allowing you to inject custom logic at various points in the controller's request-processing lifecycle. It provides a way to organize and reuse code that might be common across multiple controllers or actions, operating on the shared `state` object.

In essence, `ControllerMixin`s provide a plugin-like architecture for `Controller`s in LionRockJS, allowing developers to compose controller behavior from smaller, reusable pieces.

## State
The `state` is a core JavaScript Map object. It acts as a central repository for all runtime information related to a single request being processed by a controller instance.

In summary: The `state` object in `Controller` is a dynamic, per-request data store. It encapsulates all relevant information for processing a request and generating a response, serving as a shared context for the `controller` and its extensions (`ControllerMixins`).

### Controller State Keys

The `Controller.state` map uses the following predefined keys to store and manage request and response data:

#### General & Flow Control State Keys

*   `Controller.STATE_CLIENT ('client')`: Stores the controller instance itself.
*   `Controller.STATE_ACTION ('action')`: The name of the action method to be executed (e.g., 'index', 'show').
*   `Controller.STATE_FULL_ACTION_NAME ('fullActionName')`: The fully qualified action name, typically prefixed (e.g., 'action_index').
*   `Controller.STATE_EXITED ('exited')`: A boolean flag. If `true`, it indicates that the controller's execution flow has been intentionally stopped before completion.
*   `Controller.STATE_CHECKPOINT ('checkpoint')`: A general-purpose key that can be used by applications for various purposes, such as pagination tokens or flow control markers.

#### Request-Related State Keys

*   `Controller.STATE_REQUEST ('request')`: Contains the original, raw request object received by the server.
*   `Controller.STATE_REQUEST_BODY ('requestBody')`: Stores the parsed body content from the incoming HTTP request.
*   `Controller.STATE_REQUEST_HEADERS ('requestHeader')`: An object or map of headers received with the incoming HTTP request.
*   `Controller.STATE_REQUEST_COOKIES ('requestCookie')`: An object or map of cookies received with the incoming HTTP request.
*   `Controller.STATE_HOSTNAME ('hostname')`: The hostname that the incoming request was made to.
*   `Controller.STATE_QUERY ('query')`: An object or map of parsed query string parameters from the request URL.
*   `Controller.STATE_PARAMS ('params')`: Parameters extracted from the URL path (e.g., from dynamic route segments) or other request sources.
*   `Controller.STATE_CLIENT_IP ('clientIP')`: The IP address of the client that initiated the HTTP request.
*   `Controller.STATE_USER_AGENT ('userAgent')`: The User-Agent string sent by the client's browser or HTTP client.
*   `Controller.STATE_LANGUAGE ('language')`: Represents the language preference for the current request, often derived from request parameters or headers (e.g., 'en', 'fr').

#### Response-Related State Keys

*   `Controller.STATE_BODY ('body')`: Holds the content that will form the body of the HTTP response.
*   `Controller.STATE_HEADERS ('headers')`: An object or map of headers to be included in the outgoing HTTP response.
*   `Controller.STATE_COOKIES ('cookies')`: An object or map of cookies to be set in the outgoing HTTP response.
*   `Controller.STATE_STATUS ('status')`: The HTTP status code for the outgoing response (e.g., 200 for OK, 404 for Not Found).

## View

The `View` component in LionRockJS MVC is responsible for presenting data. It's designed to take data (usually provided by a `Controller`) and a template file, and then render them into a final output format, which could be HTML, JSON, XML, or plain text.

### Key Features

1.  **Constructor (`constructor(file="", data={}, defaultFile="")`)**:
    *   It's initialized with:
        *   `file`: A string, typically representing the path to a template file (e.g., an HTML template).
        *   `data`: An object containing the data that needs to be rendered within the template.
        *   `defaultFile`: An optional string, possibly a fallback template file if the primary `file` isn't found or specified.

2.  **Static Factory (`static factory(file, data = {})`)**:
    *   This method provides a convenient way to create `View` instances.
    *   It uses `this.DefaultViewClass` to instantiate the view. This allows developers to easily substitute a custom view class for the default one by changing the `View.DefaultViewClass` static property.

3.  **Render Method (`async render()`)**:
    *   This is the core method responsible for producing the output.
    *   In the base `View` class, the `render()` method simply returns `this.data`. This basic implementation indicates that the base `View` class is intended to be extended.
    *   Subclasses would override the `render()` method to implement specific templating logic (e.g., using a templating engine like EJS, Handlebars, Pug, or a custom rendering mechanism) to combine the `this.file` (template) with `this.data` to produce the final output (e.g., an HTML string).

### In Essence

The `View` class provides a standardized interface for rendering. Controllers typically prepare data and then pass it to a `View` instance (or a subclass of `View`) along with a template file path. The `View` instance's `render()` method is then called to generate the response content, which the controller subsequently sends back to the client.

This design allows for different view rendering strategies to be plugged in by creating new classes that inherit from this base `View` and implement their own `render()` logic.