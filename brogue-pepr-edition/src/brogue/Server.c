#include <microhttpd.h>
#include <jansson.h>
#include "Server.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <netinet/in.h> // For sockaddr_in
#include "Monsters.h"
#include "Combat.h"

#define PORT 8889

struct ConnectionInfo {
    char *data;
    size_t data_size;
};

static int post_iterator(void *cls, enum MHD_ValueKind kind, const char *key,
                         const char *filename, const char *content_type,
                         const char *transfer_encoding, const char *data, uint64_t off, size_t size) {
    struct ConnectionInfo *con_info = cls;
    (void)kind; // Unused parameter
    (void)filename; // Unused parameter
    (void)content_type; // Unused parameter
    (void)transfer_encoding; // Unused parameter
    (void)off; // Unused parameter

    if (0 == strcmp(key, "data")) {
        con_info->data = realloc(con_info->data, con_info->data_size + size + 1);
        if (!con_info->data) {
            return MHD_NO;
        }
        memcpy(con_info->data + con_info->data_size, data, size);
        con_info->data_size += size;
        con_info->data[con_info->data_size] = '\0';
    }
    return MHD_YES;
}

static void request_completed(void *cls, struct MHD_Connection *connection,
                              void **con_cls, enum MHD_RequestTerminationCode toe) {
    struct ConnectionInfo *con_info = *con_cls;
    if (con_info == NULL) {
        return;
    }
    if (con_info->data) {
        free(con_info->data);
    }
    free(con_info);
    *con_cls = NULL;
}

static int answer_to_connection(void *cls, struct MHD_Connection *connection,
                                 const char *url, const char *method,
                                 const char *version, const char *upload_data,
                                 size_t *upload_data_size, void **con_cls) {
    if (strcmp(method, "POST") != 0) {
        // Only accept POST method
        return MHD_NO;
    }

    // printf("Requested URL: %s\n", url);

    if (strcmp(url, "/deleteCreature") == 0) {
        if (*con_cls == NULL) {
            struct ConnectionInfo *con_info = malloc(sizeof(struct ConnectionInfo));
            if (con_info == NULL) {
                return MHD_NO;
            }
            con_info->data = NULL;
            con_info->data_size = 0;
            *con_cls = con_info;
            return MHD_YES;
        }

        struct ConnectionInfo *con_info = *con_cls;
        if (*upload_data_size != 0) {
            con_info->data = realloc(con_info->data, con_info->data_size + *upload_data_size + 1);
            if (!con_info->data) {
                return MHD_NO;
            }
            memcpy(con_info->data + con_info->data_size, upload_data, *upload_data_size);
            con_info->data_size += *upload_data_size;
            con_info->data[con_info->data_size] = '\0';
            *upload_data_size = 0;
            return MHD_YES;
        } else if (con_info->data) {
            json_error_t error;
            json_t *root = json_loads(con_info->data, 0, &error);
            if (!root) {
                printf("Error parsing JSON: %s\n", error.text);
            } else {
                // Process the JSON object as needed
                json_t *name = json_object_get(root, "creatureName");
                json_t *deleteType = json_object_get(root, "action");
                if (json_is_string(name) && json_is_string(deleteType) && strcmp(json_string_value(deleteType), "dungeon-master") == 0){
                    printf("Dungeon master attempting to admin delete creature: %s\n", json_string_value(name));
                    if (name != NULL) {
                        // printf("Getting ready to see if there is a creature with creature name: %s\n", json_string_value(name));

                        boolean found = !findCreature(json_string_value(name));
                        // printf("Returned from findCreature: %d\n", found);

                        if (found) {
                            // printf("Creature found by findCreature: %s\n", json_string_value(name));
                            creature* decedent = findDecedent(json_string_value(name));
                            // printf("Returned from findDecedent and set decedent to\n: %p\n", decedent->monsterDeploymentName);

                            if (decedent != NULL) {
                                // printf("Getting ready to admin delete: %s\n", json_string_value(name));
                                killCreature(decedent, true);
                                printf("Dungeon master successfully deleted: %s\n", json_string_value(name));
                            } else {
                                printf("Creature not found: %s\n", json_string_value(name));
                            }
                        } else {
                            printf("Creature not found using findCreature: %s\n", json_string_value(name));
                        }
                    }
                } else {
                    // printf("Invalid request format: creatureName is missing or not a string.\n");
                }

                json_decref(root);
            }
        }
    } else if (strcmp(url, "/deleteAllCreatures") == 0) {
    // TODO: Handle this endpoint
    } else {
    // URL does not match any configured endpoints
        const char *errorPage = "<html><body>Endpoint not found.</body></html>";
        struct MHD_Response *response = MHD_create_response_from_buffer(strlen(errorPage), (void *)errorPage, MHD_RESPMEM_PERSISTENT);
        int ret = MHD_queue_response(connection, MHD_HTTP_NOT_FOUND, response);
        MHD_destroy_response(response);
        return ret;
    }

    const char *page = "<html><body>POST data processed successfully</body></html>";

    struct MHD_Response *response = MHD_create_response_from_buffer(strlen(page),
(void *)page, MHD_RESPMEM_PERSISTENT);

    int ret = MHD_queue_response(connection, MHD_HTTP_OK, response);
    MHD_destroy_response(response);

    return ret;
}

void *startServer(void *arg) {
    printf("Starting Brogue notification server on port %d\n", PORT);
    struct MHD_Daemon *daemon;

    daemon = MHD_start_daemon(MHD_USE_INTERNAL_POLLING_THREAD, PORT, NULL, NULL, &answer_to_connection, NULL, MHD_OPTION_END);

    if (NULL == daemon) {
        fprintf(stderr, "Failed to start the server on port %d\n", PORT);
        return NULL;
    }

    printf("Server running on port %d\n", PORT);
    getchar(); // Wait for user input to terminate the server

    MHD_stop_daemon(daemon);

    return NULL; // Return value required by pthreads, even if not used

}
