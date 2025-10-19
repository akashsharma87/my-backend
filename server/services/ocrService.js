const Tesseract = require('tesseract.js');
const pdf = require('pdf-parse');
const fs = require('fs');
const path = require('path');

class OCRService {
  constructor() {
    this.skillsKeywords = [
      // Programming Languages
      'javascript', 'python', 'java', 'c++', 'c#', 'ruby', 'php', 'go', 'rust', 'kotlin',
      'swift', 'typescript', 'scala', 'r', 'matlab', 'perl', 'shell', 'bash',
      
      // Web Technologies
      'html', 'css', 'react', 'angular', 'vue', 'node.js', 'express', 'django',
      'flask', 'spring', 'laravel', 'wordpress', 'drupal', 'jquery', 'bootstrap',
      
      // Databases
      'mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'oracle', 'cassandra',
      'elasticsearch', 'firebase', 'dynamodb',
      
      // Cloud & DevOps
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git', 'github',
      'gitlab', 'ci/cd', 'terraform', 'ansible', 'puppet', 'chef',
      
      // Frameworks & Libraries
      'tensorflow', 'pytorch', 'keras', 'opencv', 'pandas', 'numpy', 'scipy',
      'matplotlib', 'seaborn', 'scikit-learn', 'apache spark', 'hadoop',
      
      // Other Technologies
      'api', 'rest', 'graphql', 'microservices', 'blockchain', 'machine learning',
      'ai', 'data science', 'big data', 'iot', 'mobile development'
    ];
  }

  async extractTextFromFile(filePath, mimeType) {
    try {
      let text = '';
      
      if (mimeType === 'application/pdf') {
        text = await this.extractFromPDF(filePath);
      } else if (mimeType.includes('word') || mimeType.includes('document')) {
        text = await this.extractFromWord(filePath);
      } else {
        // For images or other formats, use OCR
        text = await this.extractFromImage(filePath);
      }
      
      return text;
    } catch (error) {
      console.error('Error extracting text from file:', error);
      throw error;
    }
  }

  async extractFromPDF(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      return data.text;
    } catch (error) {
      console.error('Error extracting from PDF:', error);
      throw error;
    }
  }

  async extractFromWord(filePath) {
    // For now, we'll use OCR for Word documents
    // In production, you might want to use a more specialized library
    return await this.extractFromImage(filePath);
  }

  async extractFromImage(filePath) {
    try {
      const { data: { text } } = await Tesseract.recognize(filePath, 'eng', {
        logger: m => console.log(m)
      });
      return text;
    } catch (error) {
      console.error('Error extracting from image:', error);
      throw error;
    }
  }

  extractStructuredData(rawText) {
    console.log('Starting structured data extraction from text:', rawText.substring(0, 200) + '...');
    
    const data = {
      fullName: this.extractName(rawText),
      email: this.extractEmail(rawText),
      phone: this.extractPhone(rawText),
      address: this.extractAddress(rawText),
      links: this.extractLinks(rawText),
      summary: this.extractSummary(rawText),
      skills: this.extractSkillsDetailed(rawText),
      experience: this.extractExperienceDetailed(rawText),
      projects: this.extractProjectsDetailed(rawText),
      education: this.extractEducationDetailed(rawText),
      certifications: this.extractCertifications(rawText),
      languages: this.extractLanguages(rawText),
      achievements: this.extractAchievements(rawText)
    };
    
    console.log('Extraction completed. Data keys:', Object.keys(data));
    console.log('Skills extracted:', data.skills);
    console.log('Experience extracted:', data.experience?.length || 0, 'items');
    
    return data;
  }

  extractName(text) {
    // Look for name patterns at the beginning of the resume
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // First non-empty line is often the name
    if (lines.length > 0) {
      const firstLine = lines[0];
      // Basic validation: should be 2-4 words, not contain numbers or special chars
      if (/^[a-zA-Z\s]{2,50}$/.test(firstLine) && firstLine.split(' ').length <= 4) {
        return firstLine;
      }
    }
    
    return null;
  }

  extractEmail(text) {
    const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/g;
    const matches = text.match(emailRegex);
    return matches ? matches[0] : null;
  }

  extractPhone(text) {
    const phoneRegex = /(\+\d{1,3}[\s\-]?)?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4}/g;
    const matches = text.match(phoneRegex);
    return matches ? matches[0] : null;
  }

  extractLinks(text) {
    const links = {};
    
    // Extract GitHub
    const githubRegex = /github\.com\/[\w\-\.]+/gi;
    const githubMatch = text.match(githubRegex);
    if (githubMatch) {
      links.github = githubMatch[0].includes('http') ? githubMatch[0] : `https://${githubMatch[0]}`;
    } else {
      // Look for "GitHub" text followed by potential username or URL
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.toLowerCase().includes('github') && !line.toLowerCase().includes('|')) {
          // If it's just "GitHub" assume it's a placeholder
          links.github = 'https://github.com';
          break;
        }
      }
    }
    
    // Extract LinkedIn
    const linkedinRegex = /linkedin\.com\/in\/[\w\-\.]+/gi;
    const linkedinMatch = text.match(linkedinRegex);
    if (linkedinMatch) {
      links.linkedin = linkedinMatch[0].includes('http') ? linkedinMatch[0] : `https://${linkedinMatch[0]}`;
    } else {
      // Look for "LinkedIn" text
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.toLowerCase().includes('linkedin') && !line.toLowerCase().includes('|')) {
          links.linkedin = 'https://linkedin.com';
          break;
        }
      }
    }
    
    // Extract Portfolio
    const portfolioKeywords = ['portfolio', 'website', 'personal site'];
    const lines = text.split('\n');
    for (const line of lines) {
      if (portfolioKeywords.some(keyword => line.toLowerCase().includes(keyword))) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urlMatch = line.match(urlRegex);
        if (urlMatch) {
          links.portfolio = urlMatch[0];
        } else if (line.toLowerCase().includes('portfolio')) {
          links.portfolio = '#';
        }
        break;
      }
    }
    
    return links;
  }

  extractSkillsDetailed(text) {
    console.log('🔍 Starting detailed skills extraction');
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    const skillsSection = {};
    let inSkillsSection = false;
    let currentCategory = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if we're entering skills section
      if (line.toLowerCase().includes('skills') || line.toLowerCase().includes('technical skills')) {
        console.log('📍 Found skills section at line:', line);
        inSkillsSection = true;
        continue;
      }
      
      // Check if we're leaving skills section
      if (inSkillsSection && (line.toLowerCase().includes('experience') || 
                             line.toLowerCase().includes('education') || 
                             line.toLowerCase().includes('projects'))) {
        console.log('📍 Leaving skills section at line:', line);
        break;
      }
      
      if (inSkillsSection) {
        console.log('🔍 Processing skills line:', line);
        
        // Handle the specific format "ProgrammingC++, Python, JavaScript" (no space after category)
        if (line.match(/^\w+(?:[A-Z]|\/).*$/)) {
          // Find where the category ends and skills begin by looking for the first skill indicator
          let categoryEnd = -1;
          
          // Look for patterns like capital letters followed by lowercase, or common skill names
          const skillPatterns = [
            /C\+\+/, /Python/, /JavaScript/, /React/, /Node/, /AWS/, /Docker/, /Git/, /MySQL/, /Linux/,
            /Next\.js/, /Firebase/, /Supabase/, /VMware/, /DBMS/, /HTML/, /CSS/, /Java/
          ];
          
          for (const pattern of skillPatterns) {
            const match = line.match(pattern);
            if (match) {
              categoryEnd = match.index;
              break;
            }
          }
          
          if (categoryEnd > 0) {
            currentCategory = line.substring(0, categoryEnd).trim();
            const skillsText = line.substring(categoryEnd).trim();
            console.log('📂 Found category by pattern:', currentCategory, 'Skills text:', skillsText);
            
            const skills = skillsText.split(',').map(s => s.trim()).filter(s => s && s.length > 0);
            skillsSection[currentCategory] = skills;
            console.log('✅ Added skills for category:', currentCategory, skills);
          }
        }
        // Handle category headers with colon (like "Programming: C++, Python, JavaScript")
        else if (line.includes(':')) {
          const [category, skillsText] = line.split(':');
          currentCategory = category.trim();
          console.log('📂 Found category with colon:', currentCategory);
          
          if (skillsText && skillsText.trim()) {
            const skills = skillsText.split(',').map(s => s.trim()).filter(s => s && s.length > 0);
            skillsSection[currentCategory] = skills;
            console.log('✅ Added skills for category:', currentCategory, skills);
          } else {
            skillsSection[currentCategory] = [];
          }
        }
        // Handle category headers without colon (like "Programming C++, Python, JavaScript")
        else if (this.isSkillCategory(line)) {
          const match = line.match(/^(\w+(?:\s*\/\s*\w+)*)(.*)/); 
          if (match) {
            currentCategory = match[1].trim();
            const skillsText = match[2].trim();
            console.log('📂 Found category without colon:', currentCategory, 'Skills text:', skillsText);
            
            const skills = skillsText.split(',').map(s => s.trim()).filter(s => s && s.length > 0);
            skillsSection[currentCategory] = skills;
            console.log('✅ Added skills for category:', currentCategory, skills);
          }
        }
        // Handle continuation lines for current category
        else if (currentCategory && line.includes(',')) {
          const skills = line.split(',').map(s => s.trim()).filter(s => s && s.length > 0);
          if (skills.length > 0) {
            if (!skillsSection[currentCategory]) {
              skillsSection[currentCategory] = [];
            }
            skillsSection[currentCategory] = skillsSection[currentCategory].concat(skills);
            console.log('➕ Added continuation skills for category:', currentCategory, skills);
          }
        }
      }
    }
    
    console.log('🎯 Final skills section:', JSON.stringify(skillsSection, null, 2));
    return skillsSection;
  }

  extractExperienceDetailed(text) {
    console.log('🔍 Starting experience extraction');
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    const experiences = [];
    let inExperienceSection = false;
    let currentExperience = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if we're entering experience section
      if (line.toLowerCase() === 'experience' || line.toLowerCase() === 'work experience') {
        console.log('📍 Found experience section at line:', line);
        inExperienceSection = true;
        continue;
      }
      
      // Check if we're leaving experience section - be very specific about section headers
      if (inExperienceSection && 
          (line.toLowerCase() === 'key projects' || 
           line.toLowerCase() === 'projects' ||
           line.toLowerCase() === 'education' || 
           line.toLowerCase() === 'skills' ||
           line.toLowerCase() === 'achievements' ||
           line.toLowerCase() === 'certifications')) {
        console.log('📍 Leaving experience section at line:', line);
        if (currentExperience && currentExperience.position) {
          experiences.push(currentExperience);
          console.log('💼 Added final experience from section end:', currentExperience);
        }
        break;
      }
      
      if (inExperienceSection) {
        console.log('🔍 Processing experience line:', line);
        
        // Check for job title and company format: "Position | Company Date Range"
        if (line.includes('|') && !line.startsWith('•') && !line.startsWith('-')) {
          // Save previous experience if exists
          if (currentExperience && currentExperience.position) {
            experiences.push(currentExperience);
            console.log('💼 Added experience:', currentExperience);
          }
          
          const parts = line.split('|');
          const position = parts[0] ? parts[0].trim() : '';
          let companyAndDate = parts[1] ? parts[1].trim() : '';
          let company = '';
          let duration = '';
          
          // Try to separate company and date
          const dateMatch = companyAndDate.match(/(.*?)\s+(\w{3}\s+\d{4}\s*[–-]\s*.+)$/);
          if (dateMatch) {
            company = dateMatch[1].trim();
            duration = dateMatch[2].trim();
          } else {
            company = companyAndDate;
          }
          
          currentExperience = {
            position: position,
            company: company,
            duration: duration,
            location: '',
            responsibilities: []
          };
          
          console.log('🏢 Started new experience:', { position, company, duration });
        }
        // Check for bullet points or descriptions
        else if (currentExperience && (line.startsWith('•') || line.startsWith('-') || line.startsWith('*'))) {
          const description = line.replace(/^[•\-*]\s*/, '').trim();
          if (description) {
            currentExperience.responsibilities.push(description);
            console.log('📝 Added responsibility:', description);
          }
        }
        // Check for standalone descriptions
        else if (currentExperience && line.length > 10 && !line.includes('|') && !line.match(/\d{4}/)) {
          // Skip lines that look like they belong to other sections
          if (!line.toLowerCase().includes('project') && !line.toLowerCase().includes('education')) {
            currentExperience.responsibilities.push(line);
            console.log('📝 Added standalone responsibility:', line);
          }
        }
      }
    }
    
    // Add the last experience if exists
    if (currentExperience && currentExperience.position) {
      experiences.push(currentExperience);
      console.log('💼 Added final experience:', currentExperience);
    }
    
    console.log('🎯 Final experiences:', JSON.stringify(experiences, null, 2));
    return experiences;
  }

  extractProjectsDetailed(text) {
    console.log('🔍 Starting projects extraction');
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    const projects = [];
    let inProjectsSection = false;
    let currentProject = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if we're entering projects section (specifically "Key Projects")
      if (line.toLowerCase().includes('key projects') || 
          (line.toLowerCase().includes('projects') && !line.toLowerCase().includes('experience'))) {
        console.log('📍 Found projects section at line:', line);
        inProjectsSection = true;
        continue;
      }
      
      // Check if we're leaving projects section
      if (inProjectsSection && (line.toLowerCase().includes('education') || 
                               line.toLowerCase().includes('achievements') ||
                               line.toLowerCase().includes('certifications') ||
                               line.toLowerCase().includes('skills'))) {
        console.log('📍 Leaving projects section at line:', line);
        if (currentProject) {
          projects.push(currentProject);
        }
        break;
      }
      
      if (inProjectsSection) {
        console.log('🔍 Processing project line:', line);
        
        // Check for project title pattern with dash (e.g. "EducatorsHive – Lead Developer & Founder July 2025 – Aug 2025")
        // Avoid lines that look like experience entries (with | character)
        if (line.includes('–') && !line.includes('|') && !line.startsWith('•') && !line.startsWith('-')) {
          // Save previous project
          if (currentProject) {
            projects.push(currentProject);
            console.log('💼 Added project:', currentProject);
          }
          
          // Parse new project
          const parts = line.split('–');
          let name = parts[0] ? parts[0].trim() : '';
          let roleAndDate = parts.slice(1).join('–').trim();
          
          // Try to separate role and date
          let role = '';
          let duration = '';
          
          // Look for date pattern at the end
          const dateMatch = roleAndDate.match(/(.*?)\s+(\w{3,}\s+\d{4}\s*[–-]\s*.+)$/);
          if (dateMatch) {
            role = dateMatch[1].trim();
            duration = dateMatch[2].trim();
          } else {
            role = roleAndDate;
          }
          
          currentProject = {
            name: name,
            role: role,
            duration: duration,
            description: [],
            technologies: [],
            liveLink: null
          };
          
          console.log('🏢 Started new project:', { name, role, duration });
        } 
        // Check for Live Link
        else if (line.toLowerCase().includes('live link') && currentProject) {
          const urlRegex = /(https?:\/\/[^\s]+)/g;
          const urlMatch = line.match(urlRegex);
          if (urlMatch) {
            currentProject.liveLink = urlMatch[0];
            console.log('🔗 Added live link:', urlMatch[0]);
          }
        } 
        // Check for bullet points (project descriptions)
        else if ((line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) && currentProject) {
          const description = line.substring(1).trim();
          if (description) {
            currentProject.description.push(description);
            console.log('📝 Added project description:', description);
          }
        }
        // Check for standalone descriptions or tech lines
        else if (currentProject && line.length > 10 && !line.includes('–') && !line.match(/\d{4}/) && !line.includes('|')) {
          // Could be a description or technology line
          if (line.toLowerCase().includes('tech') || line.toLowerCase().includes('stack') ||
              line.toLowerCase().includes('built') || line.toLowerCase().includes('using') ||
              line.toLowerCase().includes('created') || line.toLowerCase().includes('implemented') ||
              line.toLowerCase().includes('developed') || line.toLowerCase().includes('designed')) {
            currentProject.description.push(line);
            console.log('📝 Added project detail:', line);
          }
        }
      }
    }
    
    // Add the last project if exists
    if (currentProject) {
      projects.push(currentProject);
      console.log('💼 Added final project:', currentProject);
    }
    
    console.log('🎯 Final projects:', JSON.stringify(projects, null, 2));
    return projects;
  }

  extractEducationDetailed(text) {
    const education = [];
    const lines = text.split('\n');
    let inEducationSection = false;
    let currentEducation = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineLower = line.toLowerCase();
      
      // Check if we're entering education section
      if (lineLower.includes('education') || lineLower.includes('academic')) {
        inEducationSection = true;
        continue;
      }
      
      // Check if we're leaving education section
      if (inEducationSection && this.isNewSection(lineLower)) {
        if (currentEducation) {
          education.push(currentEducation);
        }
        break;
      }
      
      if (inEducationSection && line) {
        // Check for degree pattern
        if (this.looksLikeDegree(line) || line.includes('B.Tech') || line.includes('Diploma')) {
          // Save previous education
          if (currentEducation) {
            education.push(currentEducation);
          }
          
          // Parse new education
          currentEducation = {
            degree: line,
            institution: '',
            year: '',
            gpa: '',
            location: ''
          };
        } else if (currentEducation && line && !this.looksLikeDateRange(line)) {
          // Institution name
          if (!currentEducation.institution) {
            currentEducation.institution = line;
          }
        } else if (currentEducation && this.looksLikeDateRange(line)) {
          currentEducation.year = line;
        } else if (currentEducation && line.toLowerCase().includes('cgpa')) {
          const gpaMatch = line.match(/\d+\.\d+/);
          if (gpaMatch) {
            currentEducation.gpa = gpaMatch[0];
          }
        }
      }
    }
    
    // Add last education
    if (currentEducation) {
      education.push(currentEducation);
    }
    
    return education;
  }

  extractAddress(text) {
    const lines = text.split('\n');
    
    // Look for location in the header section (first few lines)
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i].trim();
      
      // Check for patterns like "City, State" or "City, Country"
      if (line.includes(',') && !line.includes('@') && !line.includes('+')) {
        const parts = line.split('|');
        for (const part of parts) {
          if (part.includes(',') && part.trim().split(' ').length <= 4) {
            return part.trim();
          }
        }
      }
    }
    
    // Fallback to regex patterns
    const addressRegex = /(\w+[\s,]+\w+[\s,]+\d{5}(-\d{4})?)|(\w+[\s,]+\w{2}[\s,]+\d{5})|(\w+,\s*\w+)/g;
    const matches = text.match(addressRegex);
    return matches ? matches[0] : null;
  }

  extractSummary(text) {
    console.log('🔍 Starting summary extraction');
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    let inSummarySection = false;
    let summaryLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if we're entering summary section
      if (line.toLowerCase().includes('summary') || line.toLowerCase().includes('objective') ||
          line.toLowerCase().includes('profile')) {
        console.log('📍 Found summary section at line:', line);
        inSummarySection = true;
        
        // If the summary content is on the same line as the header
        const summaryContent = line.replace(/summary|objective|profile/gi, '').trim();
        if (summaryContent && summaryContent.length > 10) {
          summaryLines.push(summaryContent);
          console.log('📝 Added inline summary:', summaryContent);
        }
        continue;
      }
      
      // Check if we're leaving summary section
      if (inSummarySection && (line.toLowerCase().includes('experience') || 
                              line.toLowerCase().includes('education') || 
                              line.toLowerCase().includes('skills') ||
                              line.toLowerCase().includes('projects') ||
                              line.toLowerCase().includes('achievements'))) {
        console.log('📍 Leaving summary section at line:', line);
        break;
      }
      
      if (inSummarySection && line.length > 0) {
        // Skip lines that look like headers or section dividers
        if (!line.match(/^[A-Z\s]+$/) && !line.includes('---') && !line.includes('===') &&
            !line.toLowerCase().startsWith('programming') && !line.toLowerCase().startsWith('web') &&
            !line.toLowerCase().startsWith('cloud') && !line.toLowerCase().startsWith('tools') &&
            !line.toLowerCase().startsWith('core')) {
          summaryLines.push(line);
          console.log('📝 Added summary line:', line);
        }
      }
    }
    
    // If no summary found in dedicated section, look for lines after name/contact info
    if (summaryLines.length === 0) {
      console.log('🔍 No dedicated summary section found, searching after contact info');
      let foundContactInfo = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Look for contact info patterns
        if (line.includes('@') || line.includes('github') || line.includes('linkedin') ||
            line.match(/\+\d{2}\s*\d+/) || line.includes('portfolio')) {
          foundContactInfo = true;
          console.log('📍 Found contact info at:', line);
          continue;
        }
        
        // After contact info, look for summary-like content before any section headers
        if (foundContactInfo && line.length > 30 && 
            !line.toLowerCase().includes('experience') &&
            !line.toLowerCase().includes('education') &&
            !line.toLowerCase().includes('skills') &&
            !line.toLowerCase().includes('projects') &&
            !line.toLowerCase().includes('summary') &&
            !line.toLowerCase().startsWith('programming') &&
            !line.toLowerCase().startsWith('web') &&
            !line.toLowerCase().startsWith('cloud') &&
            !line.toLowerCase().startsWith('tools') &&
            !line.toLowerCase().startsWith('core') &&
            line.toLowerCase().includes('engineer') || line.toLowerCase().includes('developer') ||
            line.toLowerCase().includes('experience')) {
          summaryLines.push(line);
          console.log('📝 Added post-contact summary:', line);
          break; // Usually summary is just one paragraph
        }
      }
    }
    
    const summary = summaryLines.join(' ').trim();
    console.log('🎯 Final summary:', summary);
    return summary;
  }

  extractExperience(text) {
    const experienceKeywords = ['experience', 'employment', 'work history', 'professional experience'];
    const experiences = [];
    const lines = text.split('\n');
    
    let inExperienceSection = false;
    let currentExperience = {};
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      
      if (experienceKeywords.some(keyword => line.includes(keyword))) {
        inExperienceSection = true;
        continue;
      }
      
      if (inExperienceSection) {
        // Check if we've moved to a new section
        if (this.isNewSection(line)) {
          if (Object.keys(currentExperience).length > 0) {
            experiences.push(currentExperience);
          }
          break;
        }
        
        // Try to extract company and position
        if (this.looksLikeJobTitle(lines[i])) {
          if (Object.keys(currentExperience).length > 0) {
            experiences.push(currentExperience);
          }
          currentExperience = {
            position: lines[i].trim(),
            company: '',
            duration: '',
            description: ''
          };
        }
      }
    }
    
    if (Object.keys(currentExperience).length > 0) {
      experiences.push(currentExperience);
    }
    
    return experiences;
  }

  extractEducation(text) {
    const educationKeywords = ['education', 'academic', 'university', 'college', 'degree'];
    const education = [];
    const lines = text.split('\n');
    
    let inEducationSection = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      
      if (educationKeywords.some(keyword => line.includes(keyword))) {
        inEducationSection = true;
        continue;
      }
      
      if (inEducationSection) {
        if (this.isNewSection(line)) break;
        
        // Look for degree patterns
        if (this.looksLikeDegree(lines[i])) {
          education.push({
            degree: lines[i].trim(),
            institution: '',
            year: '',
            gpa: ''
          });
        }
      }
    }
    
    return education;
  }

  extractProjects(text) {
    const projectKeywords = ['projects', 'portfolio', 'work samples'];
    const projects = [];
    const lines = text.split('\n');
    
    let inProjectSection = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      
      if (projectKeywords.some(keyword => line.includes(keyword))) {
        inProjectSection = true;
        continue;
      }
      
      if (inProjectSection) {
        if (this.isNewSection(line)) break;
        
        if (lines[i].trim() && !this.isHeaderLine(lines[i])) {
          projects.push({
            name: lines[i].trim(),
            description: '',
            technologies: []
          });
        }
      }
    }
    
    return projects;
  }

  extractSkills(text) {
    const skills = [];
    const textLower = text.toLowerCase();
    
    this.skillsKeywords.forEach(skill => {
      if (textLower.includes(skill.toLowerCase())) {
        skills.push(skill);
      }
    });
    
    // Remove duplicates
    return [...new Set(skills)];
  }

  extractCertifications(text) {
    const certificationKeywords = ['certification', 'certified', 'certificate'];
    const certifications = [];
    const lines = text.split('\n');
    
    lines.forEach(line => {
      if (certificationKeywords.some(keyword => line.toLowerCase().includes(keyword))) {
        certifications.push(line.trim());
      }
    });
    
    return certifications;
  }

  extractLanguages(text) {
    const commonLanguages = ['english', 'spanish', 'french', 'german', 'chinese', 'japanese', 'korean', 'hindi', 'arabic'];
    const languages = [];
    const textLower = text.toLowerCase();
    
    commonLanguages.forEach(lang => {
      if (textLower.includes(lang)) {
        languages.push(lang.charAt(0).toUpperCase() + lang.slice(1));
      }
    });
    
    return languages;
  }

  // Helper methods
  isSkillCategory(line) {
    const categories = [
      'programming', 'web', 'app dev', 'cloud', 'tools', 'core', 'soft skills', 
      'languages', 'frameworks', 'databases', 'web/app dev', 'technical skills'
    ];
    const lineLower = line.toLowerCase();
    
    // Check if line starts with a category keyword
    const startsWithCategory = categories.some(cat => lineLower.startsWith(cat));
    
    // Check for the specific patterns in the resume
    const specificPatterns = [
      /^programming\s*[a-z]/i,
      /^web\/app\s*dev/i,
      /^cloud\s*[a-z]/i,
      /^tools\s*[a-z]/i,
      /^core\s*[a-z]/i
    ];
    
    const matchesPattern = specificPatterns.some(pattern => pattern.test(line));
    
    return startsWithCategory || matchesPattern;
  }

  looksLikeDateRange(line) {
    // Match patterns like "2022 - 2025", "May 2025 – Present", "Jan 2025 – Jan 2025"
    const datePatterns = [
      /\d{4}\s*[-–]\s*\d{4}/,
      /\d{4}\s*[-–]\s*Present/i,
      /\w{3}\s*\d{4}\s*[-–]\s*\w{3}\s*\d{4}/,
      /\w{3}\s*\d{4}\s*[-–]\s*Present/i
    ];
    
    return datePatterns.some(pattern => pattern.test(line));
  }

  extractAchievements(text) {
    const achievements = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      // Look for lines with percentages, numbers, or achievement indicators
      if (line.includes('%') || line.includes('k+') || line.includes('increased') || line.includes('improved') || line.includes('reduced')) {
        if (line.startsWith('•')) {
          achievements.push(line.substring(1).trim());
        } else if (line.trim()) {
          achievements.push(line.trim());
        }
      }
    }
    
    return achievements;
  }
  isHeaderLine(line) {
    const headerKeywords = ['experience', 'education', 'skills', 'projects', 'summary', 'objective'];
    return headerKeywords.some(keyword => line.toLowerCase().includes(keyword));
  }

  isNewSection(line) {
    const sectionKeywords = ['experience', 'education', 'skills', 'projects', 'summary', 'objective', 'certifications'];
    return sectionKeywords.some(keyword => line.includes(keyword));
  }

  looksLikeJobTitle(line) {
    const jobTitleKeywords = ['engineer', 'developer', 'manager', 'analyst', 'consultant', 'specialist', 'coordinator'];
    return jobTitleKeywords.some(keyword => line.toLowerCase().includes(keyword));
  }

  looksLikeDegree(line) {
    const degreeKeywords = ['bachelor', 'master', 'phd', 'degree', 'bs', 'ms', 'ba', 'ma'];
    return degreeKeywords.some(keyword => line.toLowerCase().includes(keyword));
  }
}

module.exports = new OCRService();