import express from 'express';
import {createClient} from '@supabase/supabase-js'
import morgan from 'morgan'
import bodyParser from "body-parser";

const app = express();


// using morgan for logs
app.use(morgan('combined'));

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

const supabaseUrl = 'https://xihueczeqyejpcooynxq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpaHVlY3plcXllanBjb295bnhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODU3MTM5NjcsImV4cCI6MjAwMTI4OTk2N30.eCHuAxOIKmme_gT_qCm6uf3HjhJEeJ4kPCx8JNWr8sU'; // Place your API key here
const supabase = createClient(supabaseUrl, supabaseKey);

// Create a new project assignment for an employee
app.post('/project-assignments', async (req, res) => {
    try {
        const {
            employee_id,
            current_ongoing_projects,
            upcoming_projects,
            allocated_projects,
            progress
        } = req.body;

        if (!employee_id) {
            return res.status(400).send("Employee ID not provided.");
        }

        // Insert the project assignment into the 'project_assignments' table
        const { error } = await supabase
            .from('project_assignments')
            .insert([
                {
                    employee_id,
                    current_ongoing_projects,
                    upcoming_projects,
                    allocated_projects,
                    progress
                }
            ]);

        if (error) throw error;

        res.send("Project assignment created successfully.");
    } catch (error) {
        console.error("Error in creating project assignment:", error);
        res.status(500).send("An error occurred while creating project assignment.");
    }
});

// Get project assignments for an employee by employee ID
app.get('/project-assignments/:employee_id', async (req, res) => {
    try {
        const employee_id = req.params.employee_id;

        // Retrieve project assignments for the specified employee ID
        const { data, error } = await supabase
            .from('project_assignments')
            .select()
            .eq('employee_id', employee_id);

        if (error) throw error;

        res.send(data);
    } catch (error) {
        console.error("Error in fetching project assignments:", error);
        res.status(500).send("An error occurred while fetching project assignments.");
    }
});

// Update project assignments for an employee by employee ID
app.put('/project-assignments/:employee_id', async (req, res) => {
    try {
        const employee_id = req.params.employee_id;
        const {
            current_ongoing_projects,
            upcoming_projects,
            allocated_projects,
            progress
        } = req.body;

        // Update the project assignments for the specified employee ID
        const { error } = await supabase
            .from('project_assignments')
            .update({
                current_ongoing_projects,
                upcoming_projects,
                allocated_projects,
                progress
            })
            .eq('employee_id', employee_id);

        if (error) throw error;

        res.send("Project assignments updated successfully.");
    } catch (error) {
        console.error("Error in updating project assignments:", error);
        res.status(500).send("An error occurred while updating project assignments.");
    }
});

// Delete project assignments for an employee by employee ID
app.delete('/project-assignments/:employee_id', async (req, res) => {
    try {
        const employee_id = req.params.employee_id;

        // Delete project assignments for the specified employee ID
        const { error } = await supabase
            .from('project_assignments')
            .delete()
            .eq('employee_id', employee_id);

        if (error) throw error;

        res.send("Project assignments deleted successfully.");
    } catch (error) {
        console.error("Error in deleting project assignments:", error);
        res.status(500).send("An error occurred while deleting project assignments.");
    }
});

app.get('/employees', async (req, res) => {
    const {data, error} = await supabase
        .from('employees')
        .select()
    res.send(data);
});

app.get('/employees/:id', async (req, res) => {
    const {data, error} = await supabase
        .from('employees')
        .select()
        .is('id', req.params.id)
    res.send(data);
});

app.post('/employees', async (req, res) => {
    const newEmployee = {
        emp_name: req.body.emp_name,
        emp_mail: req.body.emp_mail,
        emp_phone: req.body.emp_phone,
        emp_id: req.body.emp_id,
        ongoing_projects: req.body.ongoing_projects, // Expecting an array
        near_to_complete_projects: req.body.near_to_complete_projects, // Expecting an array
        skills_currently_in_implementation: req.body.skills_currently_in_implementation // Expecting an array
    };
    const { error } = await supabase.from('employees').insert(newEmployee);

    if (error) {
        return res.status(400).send(error);
    }
    res.send("Employee created!!");
});



app.get('/employees/skill/:skill', async (req, res) => {
    const skillRequired = req.params.skill;
    
    try {
        const { data, error } = await supabase
            .from('employees')
            .select('emp_name')
            .filter('skills_currently_in_implementation', 'cs', `{${skillRequired}}`);

        if (error) {
            throw error;
        }

        res.send(data.map(emp => emp.emp_name));
    } catch (error) {
        console.error("Error in fetching employees by skill:", error);
        res.status(500).send("An error occurred while fetching employees by skill.");
    }
});



app.put('/employees/:id', async (req, res) => {
    const {error} = await supabase
        .from('employees')
        .update({
            emp_name: req.body.emp_name,
            emp_mail: req.body.emp_mail,
            emp_phone: req.body.emp_phone,
            emp_id: req.body.emp_id
        
        })
        .eq('id', req.params.id)
    if (error) {
        res.send(error);
    }
    res.send("updated!!");
});

app.delete('/employees/:id', async (req, res) => {
    const {error} = await supabase
        .from('employees')
        .delete()
        .eq('id', req.params.id)
    if (error) {
        res.send(error);
    }
    res.send("deleted!!")

});
app.post('/employees/allocate-project', async (req, res) => {
    try {
        // Find employees with no ongoing projects
        const { data: availableEmployees, error: fetchError } = await supabase
            .from('employees')
            .select('*')
            .is('ongoing_projects', '{}'); // Assumes ongoing_projects is an array

        if (fetchError) throw fetchError;

        // Allocate a new project (provided in the request body)
        const newProject = req.body.project;
        if (!newProject) {
            return res.status(400).send("No project provided for allocation.");
        }

        for (const employee of availableEmployees) {
            const { error: updateError } = await supabase
                .from('employees')
                .update({ ongoing_projects: [newProject] })
                .eq('id', employee.id);

            if (updateError) throw updateError;
        }

        res.send("Project allocated to all available employees.");
    } catch (error) {
        console.error("Error in allocating project:", error);
        res.status(500).send("An error occurred during project allocation.");
    }
});
app.post('/employees/add-upcoming-project', async (req, res) => {
    try {
        const newUpcomingProject = req.body.project;

        if (!newUpcomingProject) {
            return res.status(400).send("No upcoming project specified.");
        }

        // Get all employees
        const { data: employees, error: fetchError } = await supabase
            .from('employees')
            .select('id, upcoming_projects');

        if (fetchError) throw fetchError;

        // Add the new project to each employee's upcoming_projects
        for (const employee of employees) {
            const updatedProjects = [...(employee.upcoming_projects || []), newUpcomingProject];
            
            const { error: updateError } = await supabase
                .from('employees')
                .update({ upcoming_projects: updatedProjects })
                .eq('id', employee.id);

            if (updateError) throw updateError;
        }

        res.send("Upcoming project added to all employees.");
    } catch (error) {
        console.error("Error in adding upcoming project to employees:", error);
        res.status(500).send("An error occurred while adding the upcoming project to employees.");
    }
});

app.put('/projects/progress/:projectId', async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const progressUpdate = req.body.progress;

        const { error } = await supabase
            .from('projects')
            .update({ progress: progressUpdate })
            .eq('id', projectId);

        if (error) throw error;

        res.send("Project progress updated successfully.");
    } catch (error) {
        console.error("Error in updating project progress:", error);
        res.status(500).send("An error occurred while updating project progress.");
    }
});

app.post('/employees/allocate-upcoming-projects', async (req, res) => {
    try {
        const newProject = req.body.project;

        if (!newProject) {
            return res.status(400).send("Project not provided for allocation.");
        }

        // Get all employees
        const { data: employees, error: fetchError } = await supabase
            .from('employees')
            .select('*');

        if (fetchError) throw fetchError;

        // Check if there are no employees
        if (employees.length === 0) {
            return res.status(404).send("No employees found for project allocation.");
        }

        // Initialize a batch operation for efficiency
        let batchOperation = [];

        // Allocate the project to eligible employees
        // Allocate the project to eligible employees
for (const employee of employees) {
    // Ensure employee.allocated_projects is not null or undefined
    const allocatedProjects = employee.allocated_projects || [];

    if (
        arraysAreEqual(employee.ongoing_projects, employee.near_to_complete_projects) &&
        !allocatedProjects.includes(newProject)
    ) {
        const updatedAllocatedProjects = [...allocatedProjects, newProject];

        batchOperation.push(
            supabase
                .from('employees')
                .update({ allocated_projects: updatedAllocatedProjects })
                .eq('id', employee.id)
        );
    }
}


        // Execute batch operation
        const batchResults = await Promise.all(batchOperation);
        const updateErrors = batchResults.filter(result => result.error);

        if (updateErrors.length > 0) {
            throw new Error('Error updating some employees.');
        }

        res.send("Upcoming projects allocated to eligible employees.");
    } catch (error) {
        console.error("Error in allocating upcoming projects:", error);
        res.status(500).send("An error occurred while allocating upcoming projects.");
    }
});

// Helper function to check if two arrays are equal
function arraysAreEqual(arr1, arr2) {
    if (!arr1 || !arr2) return false;
    if (arr1.length !== arr2.length) return false;
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) return false;
    }
    return true;
}


app.get('/', (req, res) => {
    res.send("Hello I am working my friend Supabase <3");
});

app.get('*', (req, res) => {
    res.send("Hello again I am working my friend to the moon and behind <3");
});

app.listen(3000, () => {
    console.log(`> Ready on http://localhost:3000`);
});