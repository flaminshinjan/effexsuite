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

app.get('/', (req, res) => {
    res.send("Hello I am working my friend Supabase <3");
});

app.get('*', (req, res) => {
    res.send("Hello again I am working my friend to the moon and behind <3");
});

app.listen(3000, () => {
    console.log(`> Ready on http://localhost:3000`);
});