#include <stdio.h>
#include <math.h>
#include <stdlib.h>
#include <errno.h>
#include <string.h>
#include <ctype.h>
#include "js-interfaces.h"
#include "liblinear/linear.h"
#define Malloc(type, n) (type *)malloc((n) * sizeof(type))
#define INF HUGE_VAL

void print_null(const char *s) {}

void exit_with_help() { exit(1); }

#ifdef __cplusplus
extern "C" {
#endif

double bias;

void parse_command_line(const char *input_command, struct parameter *param)
{
	void (*print_func)(const char *) = NULL; // default printing to stdout
	char command[256];
	char *curr = NULL;
	char *prev = NULL;

	strcpy(command, input_command);
	curr = strtok(command, " \t\n"); // label

	// default values
	param->solver_type = L2R_L2LOSS_SVC_DUAL;
	param->C = 1;
	param->p = 0.1;
	param->nu = 0.5;
	param->eps = INF; // see setting below
	param->nr_weight = 0;
	param->regularize_bias = 1;
	param->weight_label = NULL;
	param->weight = NULL;
	param->init_sol = NULL;
	bias = -1;
	int flag_solver_specified = 0;
	int flag_find_parameters = 0;

	if (curr != NULL) {
	do
	{
		if (curr[0] != '-')
			break;

		prev = curr;
		if ((curr = strtok(NULL, " \t\n")) == NULL)
			exit_with_help();

			switch (prev[1])
			{
			case 's':
				param->solver_type = atoi(curr);
				flag_solver_specified = 1;
				break;
			case 'c':
				param->C = atof(curr);
				flag_find_parameters = 1;
				break;
			case 'p':
				param->p = atof(curr);
				break;
			case 'n':
				param->nu = atof(curr);
				break;
			case 'e':
				param->eps = atof(curr);
				break;
			case 'B':
				bias = atof(curr);
				break;
			case 'w':
				++param->nr_weight;
				param->weight_label = (int *)realloc(param->weight_label, sizeof(int) * param->nr_weight);
				param->weight = (double *)realloc(param->weight, sizeof(double) * param->nr_weight);
				param->weight_label[param->nr_weight - 1] = atoi(&prev[2]);
				param->weight[param->nr_weight - 1] = atof(curr);
				break;
			case 'q':
				print_func = &print_null;
				break;
			case 'C':
				flag_find_parameters = 1;
				break;
			case 'R':
				param->regularize_bias = 0;
				break;
			default:
				fprintf(stderr,"unknown option: -%c\n", prev[1]);
				exit_with_help();
				break;
			}
		} while ((curr = strtok(NULL, " \t\n")) != NULL);
	}

	set_print_string_function(print_func);

	if(flag_find_parameters)
	{
		if (!flag_solver_specified)
			param->solver_type = L2R_L2LOSS_SVC;
		else if(param->solver_type != L2R_LR && param->solver_type != L2R_L2LOSS_SVC && param->solver_type != L2R_L2LOSS_SVR)
		{
			fprintf(stderr, "Warm-start parameter search only available for -s 0, -s 2 and -s 11\n");
			exit_with_help();
		}
	}

	if(param->eps == INF)
	{
		switch(param->solver_type)
		{
			case L2R_LR:
			case L2R_L2LOSS_SVC:
				param->eps = 0.01;
				break;
			case L2R_L2LOSS_SVR:
				param->eps = 0.0001;
				break;
			case L2R_L2LOSS_SVC_DUAL:
			case L2R_L1LOSS_SVC_DUAL:
			case MCSVM_CS:
			case L2R_LR_DUAL:
				param->eps = 0.1;
				break;
			case L1R_L2LOSS_SVC:
			case L1R_LR:
				param->eps = 0.01;
				break;
			case L2R_L1LOSS_SVR_DUAL:
			case L2R_L2LOSS_SVR_DUAL:
				param->eps = 0.1;
				break;
			case ONECLASS_SVM:
				param->eps = 0.01;
				break;
		}
	}
}

void add_instance(struct problem *prob, double *features, int nb_dimensions, double y, int i)
{
	for (int j = 0; j < nb_dimensions; j++)
	{
		prob->x[i][j].index = j + 1;
		prob->x[i][j].value = features[j];
	}
	prob->x[i][nb_dimensions].index = -1;
	prob->y[i] = y;
}

char *serialize_model(struct model *model)
{
	int success = save_model("testfile.txt", model);
	if (success < 0)
		return NULL;
	FILE *f = fopen("testfile.txt", "rb");
	fseek(f, 0, SEEK_END);
	long fsize = ftell(f);
	fseek(f, 0, SEEK_SET); //same as rewind(f);

	char *string = Malloc(char, fsize + 1);
	fread(string, fsize, 1, f);
	fclose(f);

	string[fsize] = 0;
	return string;
}

struct model *deserialize_model(const char *serialized)
{
	FILE *f = fopen("testfile.txt", "w");
	fprintf(f, "%s", serialized);
	fclose(f);
	return load_model("testfile.txt");
}

struct problem *create_nodes(int nb_features, int nb_dimensions)
{
	struct problem *prob = Malloc(struct problem, 1);
	prob->l = nb_features;
	prob->y = Malloc(double, prob->l);
	prob->x = Malloc(struct feature_node *, prob->l);
	struct feature_node *x_space = Malloc(struct feature_node, nb_features * nb_dimensions + prob->l);
	prob->n = nb_dimensions;

	for (int i = 0; i < prob->l; ++i)
		prob->x[i] = x_space + i * (nb_dimensions + 1);

	return prob;
}

void free_model(struct model *model)
{
	free_and_destroy_model(&model);
}

struct model *liblinear_train_problem(struct problem *prob, const char *command)
{
	struct parameter param;
	parse_command_line(command, &param);
	prob->bias = bias;
	struct model *model = train(prob, &param);

	destroy_param(&param);
	return model;
}

void liblinear_cross_validation(struct problem *prob, const char *command, int kFold, double *target)
{
	struct parameter param;
	parse_command_line(command, &param);
	cross_validation(prob, &param, kFold, target);
	destroy_param(&param);
}

void free_problem(struct problem *prob)
{
	free(prob->y);
	if (prob->l > 0)
	{
		free(prob->x[0]);
	}
	free(prob->x);
	free(prob);
}

struct feature_node *init_node(double *data, int size)
{
	struct feature_node *node = Malloc(struct feature_node, size + 1);
	for (int i = 0; i < size; i++)
	{
		node[i].index = i + 1;
		node[i].value = data[i];
	}
	node[size].index = -1;
	return node;
}

double liblinear_predict_one(struct model *model, double *data, int size)
{
	struct feature_node *node = init_node(data, size);
	double pred = predict(model, node);
	free(node);
	return pred;
}

double liblinear_predict_one_probability(struct model *model, double *data, int size, double *prob_estimates)
{
	struct feature_node *node = init_node(data, size);
	double pred = predict_probability(model, node, prob_estimates);
	return pred;
}

struct model *liblinear_train(double *data, double *labels, int nb_features, int nb_dimensions, const char *command)
{
	struct problem *prob = create_nodes(nb_features, nb_dimensions);
	for (int i = 0; i < nb_features; i++)
	{
		for (int j = 0; j < nb_dimensions; j++)
		{
			prob->x[i][j].index = j + 1;
			prob->x[i][j].value = data[i * nb_dimensions + j];
		}
		prob->x[i][nb_dimensions].index = -1;
		prob->y[i] = labels[i];
	}

	return liblinear_train_problem(prob, command);
}

#ifdef __cplusplus
}
#endif
