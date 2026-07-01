## face_recognition_student

**Author:** ohmyking
**Version:** 0.0.1
**Type:** tool

### Description

A Dify plugin that integrates face recognition with student information retrieval. This tool automatically performs face recognition to identify a student and then queries the student database to retrieve their detailed information.

### Features

- **Automatic Face Recognition**: Calls face recognition API to identify students
- **Student Information Retrieval**: Queries student database using the identified student ID
- **Configurable Server Endpoints**: Both face recognition and student info API endpoints are configurable

### Configuration

Before using this plugin, you need to configure the following credentials:

1. **Face Recognition Server URL**: The endpoint for face recognition API (e.g., `http://10.129.174.189:5000/recognize`)
2. **Student Info Server URL**: The endpoint for student information API (e.g., `http://10.129.134.141:8007/api/student_info`)

### Usage

This tool doesn't require any input parameters. When invoked, it will:

1. Automatically call the face recognition API
2. Retrieve the student ID from the recognition result
3. Query the student information using the ID
4. Return the complete student information

### Output

The tool returns:
- `student_id`: The identified student's ID (integer)
- `student_info`: Detailed student information (string)
- `status`: Operation status ("success" or "error")

### Requirements

- Access to face recognition server
- Access to student information database server
- Proper network configuration to reach both servers