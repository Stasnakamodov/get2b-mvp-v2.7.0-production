#!/usr/bin/env python3
import re
import sys
from pathlib import Path

def fix_logger_calls(content):
    """Fix logger calls with more than 2 arguments"""

    # Pattern to find logger calls with 3+ arguments
    # logger.info('message', arg1, arg2, ...)

    def replace_logger(match):
        prefix = match.group(1)  # logger.info/error/warn/debug
        quote = match.group(2)   # ' or "
        message = match.group(3)  # the message
        rest = match.group(4)    # rest of arguments

        # Parse the arguments
        args = []
        depth = 0
        current = ""
        for char in rest:
            if char in '([{':
                depth += 1
                current += char
            elif char in ')]}':
                depth -= 1
                current += char
            elif char == ',' and depth == 0:
                if current.strip():
                    args.append(current.strip())
                current = ""
            else:
                current += char
        if current.strip():
            args.append(current.strip())

        # If only 1 arg, return as is (valid)
        if len(args) <= 1:
            return match.group(0)

        # Create an object from multiple args
        if len(args) == 2:
            return f"{prefix}({quote}{message}{quote}, {{ first: {args[0]}, second: {args[1]} }})"
        elif len(args) == 3:
            return f"{prefix}({quote}{message}{quote}, {{ a: {args[0]}, b: {args[1]}, c: {args[2]} }})"
        else:
            # Too many args, just combine first few
            return f"{prefix}({quote}{message}{quote}, {{ data: [{', '.join(args[:3])}] }})"

    # Simple approach: just look for lines with logger.info/error/warn and fix manually
    lines = content.split('\n')
    fixed_lines = []

    for line in lines:
        # Check if this line has a logger call with multiple args after the message
        if 'logger.' in line and ('logger.info' in line or 'logger.error' in line or 'logger.warn' in line or 'logger.debug' in line):
            # Count commas after the opening quote
            # Simple heuristic: if there's more than one comma after the first string arg, it's a problem
            match = re.search(r"logger\.(info|error|warn|debug)\(['\"]([^'\"]*)['\"],\s*([^)]+)\)", line)
            if match:
                log_type = match.group(1)
                msg = match.group(2)
                rest = match.group(3)

                # Count arguments by commas at depth 0
                depth = 0
                arg_count = 1
                for char in rest:
                    if char in '([{':
                        depth += 1
                    elif char in ')]}':
                        depth -= 1
                    elif char == ',' and depth == 0:
                        arg_count += 1

                if arg_count > 1:
                    # Wrap all args in an object
                    new_rest = '{ data: [' + rest + '] }'
                    line = line.replace(rest + ')', new_rest + ')')

        fixed_lines.append(line)

    return '\n'.join(fixed_lines)


def process_file(filepath):
    try:
        with open(filepath, 'r') as f:
            content = f.read()

        # Count problematic patterns
        original_count = len(re.findall(r"logger\.\w+\(['\"][^'\"]*['\"],\s*[^,]+,\s*[^)]+\)", content))

        if original_count == 0:
            return 0

        fixed = fix_logger_calls(content)

        with open(filepath, 'w') as f:
            f.write(fixed)

        print(f"Fixed {filepath}: {original_count} calls")
        return original_count
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return 0


def main():
    total = 0
    for pattern in ['app/**/*.tsx', 'app/**/*.ts', 'components/**/*.tsx', 'src/**/*.ts']:
        for filepath in Path('.').glob(pattern):
            if 'node_modules' in str(filepath) or '.next' in str(filepath):
                continue
            total += process_file(filepath)

    print(f"\nTotal fixed: {total}")


if __name__ == '__main__':
    main()