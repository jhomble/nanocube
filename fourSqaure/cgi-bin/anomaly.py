import main
import sys
#This file was created because there was an issue with global variables not being updated if main was called directly from main.py
if __name__ == '__main__':
	main.main(sys.argv)