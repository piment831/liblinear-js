CC = emcc
CXX = em++

CFLAGS = -Wall -Wconversion -O -fPIC --memory-init-file 0
BUILD_DIR=out/emscripten
EXPORTED_FUNCTIONS="['_parse_command_line', '_create_nodes', '_add_instance', '_liblinear_train_problem', '_liblinear_train', '_liblinear_predict_one', '_liblinear_predict_one_probability', '_free_model', '_get_nr_class', '_get_labels', '_liblinear_cross_validation', '_free_problem', '_serialize_model', '_deserialize_model', '_malloc', '_free']"

all: wasm asm

newton.o: liblinear/newton.cpp liblinear/newton.h
	$(CXX) $(CFLAGS) -c -o newton.o liblinear/newton.cpp

linear.o: liblinear/linear.cpp liblinear/linear.h
	$(CXX) $(CFLAGS) -c -o linear.o liblinear/linear.cpp

blas/blas.a: liblinear/blas/*.c liblinear/blas/*.h
	make -C liblinear/blas OPTFLAGS='$(CFLAGS)' CC='$(CC)';

wasm: js-interfaces.c newton.o linear.o blas/blas.a liblinear/linear.h
	mkdir -p $(BUILD_DIR)/wasm; $(CC) $(CFLAGS) js-interfaces.c newton.o linear.o liblinear/blas/blas.a -o $(BUILD_DIR)/wasm/liblinear.js -s DISABLE_EXCEPTION_CATCHING=0 -s NODEJS_CATCH_EXIT=0 -s "EXPORT_NAME=\"LINEAR\"" -s MODULARIZE=1 -s WASM=1 -s ALLOW_MEMORY_GROWTH=1 -s EXPORTED_FUNCTIONS=$(EXPORTED_FUNCTIONS)  -s EXPORTED_RUNTIME_METHODS='["cwrap", "UTF8ToString"]'

asm: js-interfaces.c newton.o linear.o blas/blas.a liblinear/linear.h
	mkdir -p $(BUILD_DIR)/asm; $(CC) $(CFLAGS) js-interfaces.c newton.o linear.o liblinear/blas/blas.a -o $(BUILD_DIR)/asm/liblinear.js -s NODEJS_CATCH_EXIT=0 -s "EXPORT_NAME=\"LINEAR\"" -s MODULARIZE=1 -s WASM=0 -s ALLOW_MEMORY_GROWTH=1 -s EXPORTED_FUNCTIONS=$(EXPORTED_FUNCTIONS)   -s EXPORTED_RUNTIME_METHODS='["cwrap", "UTF8ToString"]'

clean:
	make -C liblinear/blas clean
	rm -f *~ js-interfaces.o newton.o linear.o
