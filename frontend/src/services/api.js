
/**
 * Fetches computer science related books from Open Library to simulate "Courses".
 * @returns {Promise<Array>} List of courses
 */
export const fetchCourses = async () => {
  try {
    // Search for "computer science" books with covers
    const response = await fetch('https://openlibrary.org/search.json?q=computer+science&limit=12');
    const data = await response.json();

    return data.docs.map((doc, index) => ({
      id: doc.key || index,
      title: doc.title,
      desc: doc.first_sentence ? doc.first_sentence[0] : (doc.author_name ? `By ${doc.author_name.join(', ')}` : 'No description available.'),
      image: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : 'https://via.placeholder.com/300x400?text=Course+Cover',
      author: doc.author_name ? doc.author_name[0] : 'Unknown',
      year: doc.first_publish_year || 'N/A',
      link: `https://openlibrary.org${doc.key}`
    }));
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    return [];
  }
};

/**
 * Fetches software engineering books to simulate "Assignments".
 * @returns {Promise<Array>} List of assignments
 */
export const fetchAssignments = async () => {
  try {
    const response = await fetch('https://openlibrary.org/search.json?q=software+engineering&limit=6');
    const data = await response.json();

    const today = new Date();

    return data.docs.map((doc, index) => {
      const dueDate = new Date(today);
      dueDate.setDate(today.getDate() + (index + 2) * 2); // Stagger due dates

      return {
        id: doc.key || index,
        title: `Review: ${doc.title}`,
        desc: `Complete a comprehensive review of Chapter ${index + 1}.`,
        due: dueDate.toISOString().split('T')[0],
        status: index % 2 === 0 ? 'Pending' : 'In Progress'
      };
    });
  } catch (error) {
    console.error("Failed to fetch assignments:", error);
    return [];
  }
};

/**
 * Fetches detailed metadata for a specific book (Work) from Open Library.
 * @param {string} workKey - The Open Library Work Key (e.g., "/works/OL12345W")
 * @returns {Promise<Object>} Detailed book object
 */
export const fetchBookDetails = async (workKey) => {
  try {
    const response = await fetch(`https://openlibrary.org${workKey}.json`);
    const data = await response.json();

    // Fetch author details if available (usually returns an author key)
    let authorName = "Unknown Author";
    if (data.authors && data.authors.length > 0) {
      try {
        const authorKey = data.authors[0].author.key;
        const authorRes = await fetch(`https://openlibrary.org${authorKey}.json`);
        const authorData = await authorRes.json();
        authorName = authorData.name;
      } catch (e) {
        console.warn("Failed to fetch author details:", e);
      }
    }

    return {
      title: data.title,
      description: typeof data.description === 'string' ? data.description : (data.description?.value || "No description available for this title."),
      subjects: data.subjects || [],
      author: authorName,
      covers: data.covers || [],
      publishDate: data.first_publish_date || "Unknown",
      link: `https://openlibrary.org${workKey}`
    };
  } catch (error) {
    console.error("Failed to fetch book details:", error);
    return null;
  }
};
