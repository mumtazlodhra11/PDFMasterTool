def filter_java_warnings(error_message: str) -> str:
    """
    Filter out all Java/javaldx warnings from error messages.
    This prevents Java-related errors from being shown to users.
    """
    if not error_message:
        return error_message
    
    # Split into lines
    lines = error_message.split('\n')
    
    # Filter out Java-related lines
    filtered_lines = []
    for line in lines:
        line_lower = line.lower()
        # Skip lines with Java warnings
        if any(keyword in line_lower for keyword in [
            'javaldx',
            'java may not function',
            'failed to launch javaldx',
            'java runtime',
            'java environment',
            'jfw'
        ]):
            continue
        # Keep non-Java lines
        filtered_lines.append(line)
    
    # Join back
    result = '\n'.join([line for line in filtered_lines if line.strip()])
    
    # If result is empty or just whitespace, provide generic message
    if not result.strip():
        # Check if original had Java warnings
        if any(keyword in error_message.lower() for keyword in ['java', 'javaldx']):
            return "Conversion failed. Please try again."
        return error_message
    
    # Clean up multiple "Conversion failed:" prefixes
    while 'Conversion failed: Conversion failed:' in result:
        result = result.replace('Conversion failed: Conversion failed:', 'Conversion failed:')
    
    return result





