.PHONY: help setup start stop test lint build deploy status baseline progressive failure experiment evidence cleanup demo

%:
	@$(MAKE) -C cloud05-release-safety $@
