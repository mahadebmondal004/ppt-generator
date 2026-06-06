const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const API_URL = 'http://localhost:5001/api';

async function verify() {
  try {
    console.log('1. Registering new test user...');
    const email = `testuser_${Date.now()}@example.com`;
    const regRes = await axios.post(`${API_URL}/auth/register`, {
      name: 'Test User',
      email,
      password: 'password123',
      school: 'Verification School'
    });
    const token = regRes.data.token;
    console.log('✅ Registered successfully. Token received.');

    console.log('\n2. Fetching Curriculum Boards...');
    const boardsRes = await axios.get(`${API_URL}/curriculum/boards`);
    console.log(`✅ Boards found: ${boardsRes.data.boards.map(b => b.name).join(', ')}`);

    const board = 'CBSE';
    console.log(`\n3. Fetching Grades for ${board}...`);
    const gradesRes = await axios.get(`${API_URL}/curriculum/grades?board=${board}`);
    console.log(`✅ Grades found: ${gradesRes.data.grades.join(', ')}`);

    const grade = 'Grade 9';
    console.log(`\n4. Fetching Subjects for ${board} ${grade}...`);
    const subjRes = await axios.get(`${API_URL}/curriculum/subjects?board=${board}&grade=${grade}`);
    console.log(`✅ Subjects found: ${subjRes.data.subjects.join(', ')}`);

    const subject = 'Science';
    console.log(`\n5. Fetching Topics for ${subject}...`);
    const topicsRes = await axios.get(`${API_URL}/curriculum/topics?board=${board}&grade=${grade}&subject=${subject}`);
    const topics = topicsRes.data.topics;
    console.log(`✅ Topics found: ${topics.map(t => t.name).join(', ')}`);

    console.log('\n6. Initiating AI Generation (Gemini 1.5 Pro)...');
    const form = new FormData();
    form.append('board', board);
    form.append('grade', grade);
    form.append('subject', subject);
    form.append('topic', topics[0].name);
    form.append('subTopics', topics[0].subTopics[0].name);
    form.append('slideCount', 3);
    form.append('classDuration', 15);
    form.append('difficultyLevel', 'intermediate');
    form.append('imagePreference', 'none');

    const genRes = await axios.post(`${API_URL}/generate`, form, {
      headers: { ...form.getHeaders(), Authorization: `Bearer ${token}` }
    });
    
    const genId = genRes.data.generationId;
    console.log(`✅ Generation started! ID: ${genId}`);
    
    console.log('Polling generation status...');
    let status = 'generating';
    while (status === 'generating' || status === 'pending') {
      await new Promise(resolve => setTimeout(resolve, 3000));
      const statusRes = await axios.get(`${API_URL}/generate/${genId}/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      status = statusRes.data.status;
      console.log(`...status: ${status}`);
    }

    if (status === 'completed') {
      const finalRes = await axios.get(`${API_URL}/generate/${genId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Generation completed successfully!');
      console.log(`Generated ${finalRes.data.generation.slides.length} slides.`);
      console.log(`Slide 1 Title: ${finalRes.data.generation.slides[0].title}`);
      
      console.log('\n7. Triggering PPT file build/download...');
      await axios.get(`${API_URL}/generate/${genId}/download/ppt`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'arraybuffer'
      });
      console.log('✅ PPT file built successfully!');
      console.log('🎉 Application Verification: FULLY PASSED');
    } else {
      console.error(`❌ Generation failed with status: ${status}`);
    }

  } catch (err) {
    console.error('❌ Verification failed:', err.response?.data || err.message);
  }
}

verify();
