test:
	npm test

pages:
	rm -rRf ../grover-pages/*
	cp -R ./coverage/lcov-report/* ../grover-pages/

coverage: test pages


.PHONY: test coverage
