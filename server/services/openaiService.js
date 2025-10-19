const { OpenAI } = require('openai');

class OpenAIService {
  constructor() {
    this.openai = null;
    this.apiKey = process.env.OPENAI_API_KEY;

    if (this.apiKey) {
      try {
        this.openai = new OpenAI({
          apiKey: this.apiKey,
        });
        console.log('✅ OpenAI service initialized successfully');
      } catch (error) {
        console.warn('⚠️ Failed to initialize OpenAI service:', error.message);
      }
    } else {
      console.warn('⚠️ OpenAI API key not provided. AI features will be disabled.');
    }
  }

  _checkOpenAI() {
    if (!this.openai) {
      throw new Error('OpenAI service is not available. Please configure OPENAI_API_KEY environment variable.');
    }
  }

  async parseResume(resumeText) {
    try {
      this._checkOpenAI();
      console.log('🤖 Starting OpenAI resume parsing...');
      
      const prompt = `You are a professional resume parser. Parse the following resume text and extract structured information in JSON format. Be as accurate and detailed as possible.

Resume Text:
${resumeText}

Please extract and return a JSON object with the following structure:
{
  "personalInfo": {
    "fullName": "Full name from resume",
    "email": "Email address",
    "phone": "Phone number",
    "address": "Full address or location",
    "linkedIn": "LinkedIn profile URL or null",
    "github": "GitHub profile URL or null",
    "portfolio": "Portfolio website URL or null",
    "summary": "Professional summary or objective"
  },
  "experience": [
    {
      "company": "Company name",
      "position": "Job title",
      "duration": "Employment duration (e.g., 'Jan 2020 - Present')",
      "description": "Job description and responsibilities",
      "location": "Company location",
      "technologies": ["Array of technologies/tools used"]
    }
  ],
  "education": [
    {
      "institution": "School/University name",
      "degree": "Degree type and field",
      "year": "Graduation year or duration",
      "gpa": "GPA if mentioned",
      "location": "Institution location",
      "honors": "Any honors or distinctions"
    }
  ],
  "skills": {
    "technical": ["Array of technical skills"],
    "programming": ["Programming languages"],
    "frameworks": ["Frameworks and libraries"],
    "databases": ["Database technologies"],
    "tools": ["Development tools and software"],
    "cloud": ["Cloud platforms and services"],
    "other": ["Other relevant skills"]
  },
  "projects": [
    {
      "name": "Project name",
      "description": "Project description",
      "technologies": ["Technologies used"],
      "url": "Project URL or repository if mentioned",
      "duration": "Project timeline"
    }
  ],
  "certifications": [
    {
      "name": "Certification name",
      "issuer": "Issuing organization",
      "date": "Date obtained",
      "expiryDate": "Expiry date if applicable",
      "credentialId": "Credential ID if mentioned"
    }
  ],
  "languages": [
    {
      "language": "Language name",
      "proficiency": "Proficiency level (e.g., Native, Fluent, Intermediate, Basic)"
    }
  ],
  "achievements": [
    {
      "title": "Achievement title",
      "description": "Achievement description",
      "date": "Date of achievement",
      "organization": "Awarding organization"
    }
  ],
  "volunteering": [
    {
      "organization": "Organization name",
      "role": "Volunteer role",
      "duration": "Duration of volunteering",
      "description": "Description of activities"
    }
  ],
  "publications": [
    {
      "title": "Publication title",
      "publisher": "Publisher or venue",
      "date": "Publication date",
      "url": "URL if available"
    }
  ],
  "metadata": {
    "totalExperienceYears": "Calculated total years of experience as number",
    "currentRole": "Current job title",
    "currentCompany": "Current company",
    "location": "Current location",
    "availability": "Job seeking status if mentioned",
    "salaryExpectation": "Salary expectation if mentioned"
  }
}

Important guidelines:
1. Extract only information that is clearly stated in the resume
2. Use null for missing information
3. For arrays, return empty arrays [] if no items found
4. Be consistent with date formats
5. For experience years, calculate based on work history
6. Extract skills comprehensively from all sections
7. If LinkedIn/GitHub profiles are mentioned but no URL, set to the profile page format
8. Return valid JSON only, no additional text or explanations`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a professional resume parser that extracts structured data from resumes. Always return valid JSON format only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 4000,
      });

      const responseContent = completion.choices[0].message.content.trim();
      console.log('📄 OpenAI response received, parsing JSON...');
      
      // Clean the response to ensure it's valid JSON
      let cleanedResponse = responseContent;
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
      }
      
      const parsedData = JSON.parse(cleanedResponse);
      
      // Transform the data to match our database schema
      const transformedData = this.transformToDBSchema(parsedData);
      
      console.log('✅ Resume parsing completed successfully');
      return transformedData;
      
    } catch (error) {
      console.error('❌ Error parsing resume with OpenAI:', error);
      throw new Error(`OpenAI parsing failed: ${error.message}`);
    }
  }

  transformToDBSchema(openaiData) {
    // Transform OpenAI response to match our database extractedData schema
    const transformed = {
      fullName: openaiData.personalInfo?.fullName || null,
      email: openaiData.personalInfo?.email || null,
      phone: openaiData.personalInfo?.phone || null,
      address: openaiData.personalInfo?.address || null,
      summary: openaiData.personalInfo?.summary || null,
      links: {
        linkedin: openaiData.personalInfo?.linkedIn || null,
        github: openaiData.personalInfo?.github || null,
        portfolio: openaiData.personalInfo?.portfolio || null
      },
      experience: (openaiData.experience || []).map(exp => ({
        company: exp.company || '',
        position: exp.position || '',
        duration: exp.duration || '',
        description: exp.description || '',
        location: exp.location || '',
        technologies: exp.technologies || []
      })),
      education: (openaiData.education || []).map(edu => ({
        institution: edu.institution || '',
        degree: edu.degree || '',
        year: edu.year || '',
        gpa: edu.gpa || '',
        location: edu.location || '',
        honors: edu.honors || ''
      })),
      skills: {
        technical: openaiData.skills?.technical || [],
        programming: openaiData.skills?.programming || [],
        frameworks: openaiData.skills?.frameworks || [],
        databases: openaiData.skills?.databases || [],
        tools: openaiData.skills?.tools || [],
        cloud: openaiData.skills?.cloud || [],
        other: openaiData.skills?.other || [],
        // Flatten all skills for backward compatibility
        all: [
          ...(openaiData.skills?.technical || []),
          ...(openaiData.skills?.programming || []),
          ...(openaiData.skills?.frameworks || []),
          ...(openaiData.skills?.databases || []),
          ...(openaiData.skills?.tools || []),
          ...(openaiData.skills?.cloud || []),
          ...(openaiData.skills?.other || [])
        ].filter((skill, index, self) => self.indexOf(skill) === index) // Remove duplicates
      },
      projects: (openaiData.projects || []).map(proj => ({
        name: proj.name || '',
        description: proj.description || '',
        technologies: proj.technologies || [],
        url: proj.url || null,
        duration: proj.duration || null
      })),
      certifications: (openaiData.certifications || []).map(cert => ({
        name: cert.name || '',
        issuer: cert.issuer || '',
        date: cert.date || '',
        expiryDate: cert.expiryDate || null,
        credentialId: cert.credentialId || null
      })),
      languages: (openaiData.languages || []).map(lang => ({
        language: lang.language || '',
        proficiency: lang.proficiency || ''
      })),
      achievements: (openaiData.achievements || []).map(achievement => ({
        title: achievement.title || '',
        description: achievement.description || '',
        date: achievement.date || '',
        organization: achievement.organization || ''
      })),
      volunteering: openaiData.volunteering || [],
      publications: openaiData.publications || [],
      metadata: {
        totalExperienceYears: openaiData.metadata?.totalExperienceYears || 0,
        currentRole: openaiData.metadata?.currentRole || null,
        currentCompany: openaiData.metadata?.currentCompany || null,
        location: openaiData.metadata?.location || null,
        availability: openaiData.metadata?.availability || null,
        salaryExpectation: openaiData.metadata?.salaryExpectation || null
      },
      extractedAt: new Date(),
      extractionStatus: 'completed',
      rawOpenAIResponse: openaiData // Store the full OpenAI response for reference
    };

    return transformed;
  }

  async enhanceProfile(existingProfile, resumeData) {
    try {
      this._checkOpenAI();
      console.log('🔄 Enhancing user profile with resume data...');
      
      const prompt = `You are a profile enhancement assistant. Based on the extracted resume data, suggest improvements and fill gaps in the user's existing profile. Merge the information intelligently, giving priority to resume data when it's more complete or recent.

Existing Profile:
${JSON.stringify(existingProfile, null, 2)}

Resume Data:
${JSON.stringify(resumeData, null, 2)}

Please return an enhanced profile in the following JSON format:
{
  "fullName": "Best available full name",
  "email": "Best available email",
  "phone": "Best available phone",
  "bio": "Enhanced professional bio/summary",
  "location": "Best available location",
  "jobTitle": "Current or most recent job title",
  "company": "Current or most recent company",
  "website": "Best available portfolio/website",
  "skills": ["Merged and deduplicated skills array"],
  "experience": "Enhanced experience summary",
  "linkedin": "LinkedIn profile URL",
  "github": "GitHub profile URL",
  "portfolio": "Portfolio website URL",
  "totalExperience": "Total years of experience as number",
  "currentRole": "Current role",
  "availability": "Job seeking status"
}

Guidelines:
- Merge information intelligently
- Prioritize more complete and recent data
- Create a compelling bio from summary and experience
- Deduplicate skills
- Calculate total experience from work history
- Use null for unavailable information
- Return valid JSON only`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a profile enhancement assistant that merges profile and resume data intelligently."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2000,
      });

      const responseContent = completion.choices[0].message.content.trim();
      
      // Clean the response
      let cleanedResponse = responseContent;
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
      }
      
      const enhancedProfile = JSON.parse(cleanedResponse);
      console.log('✅ Profile enhancement completed successfully');
      
      return enhancedProfile;
      
    } catch (error) {
      console.error('❌ Error enhancing profile with OpenAI:', error);
      throw new Error(`Profile enhancement failed: ${error.message}`);
    }
  }
}

module.exports = new OpenAIService();