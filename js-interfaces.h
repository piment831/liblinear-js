#ifndef JS_INTERFACES
#define JS_INTERFACES

#include "liblinear/linear.h"

#ifdef __cplusplus
extern "C" {
#endif

void print_null(const char *s);
void exit_with_help();
void parse_command_line(const char* input_command, struct parameter* param);
void add_instance(struct problem* prob, double* features, int nb_dimensions, double y, int i);
char* serialize_model(struct model* model);
struct model* deserialize_model(const char* serialized);
struct problem* create_nodes(int nb_features, int nb_dimensions);
void free_model(struct model *model);
struct model* liblinear_train_problem(struct problem* prob, const char* command);
double liblinear_predict_one(struct model* model, double* data, int size);
struct model* liblinear_train(double *data, double *labels, int nb_features, int nb_dimensions, const char* command);
void free_problem(struct problem* prob);
void liblinear_cross_validation(struct problem* problem, const char* command, int kFold, double* target);

#ifdef __cplusplus
}
#endif

#endif
