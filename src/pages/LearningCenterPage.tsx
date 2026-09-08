import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HelpCircle } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

import { useUser } from '../contexts/UserContext';
import Logo from '../components/layout/Logo';
import SkillAssessmentModal from '../components/modals/SkillAssessmentModal';
import { SkillAssessmentResult, LearningPath } from '../types/learning';
import { Module } from '../types/learning';
import { learningService, getBadgeById } from '../services/learningService';


const LearningCenterPage: React.FC = () => {
  // Add state and handlers for photo explainer
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExplainPhoto = () => {
    // Placeholder: send photoPreview to backend or process it
    alert(t('learningPage.photoExplainer.comingSoon'));
  };
  const [currentView, setCurrentView] = useState<'overview' | 'pathDetail' | 'moduleContent' | 'assessment' | 'course'>('overview');
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [userLevel, setUserLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced' | null>(null); // This might be driven by recommendedStartingPathId or assessment
  const [assessmentStep, setAssessmentStep] = useState(0); // For the old assessment, might remove or adapt
  const [assessmentAnswers, setAssessmentAnswers] = useState<number[]>([]);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const { t } = useTranslation();
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [isLoadingPaths, setIsLoadingPaths] = useState(true);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);

  const { userData, updateUserData, loading: userLoading } = useUser(); // Added userLoading
  const [userProgress, setUserProgress] = useState<any>(null);

  useEffect(() => {
    const fetchPaths = async () => {
      setIsLoadingPaths(true);
      try {
        const paths = await learningService.getLearningPaths();
        // --- DEMO: Add real content to the first lesson of the first path ---
        if (paths && paths.length > 0 && paths[0].modules && paths[0].modules.length > 0) {
          paths[0].modules[0] = {
            ...paths[0].modules[0],
            content: `
              <h3>How to Turn On a Device</h3>
              <ol style="font-size:1.1em;line-height:1.7;">
                <li><b>Find the Power Button:</b> Look for a button with a circle and a line (⏻) on your device. It is usually on the side, top, or front.</li>
                <li><b>Press and Hold:</b> Gently press and hold the power button for 1-2 seconds.</li>
                <li><b>Wait for Lights or Sounds:</b> The screen may light up, or you may hear a sound. This means your device is turning on.</li>
                <li><b>Be Patient:</b> It may take a few moments for the device to be ready to use.</li>
              </ol>
              <p style="margin-top:1em;">If nothing happens, make sure the device is plugged in or charged.</p>
            `
          };
        }
        setLearningPaths(paths);
      } catch (error) {
        console.error("Error fetching learning paths:", error);
        // Handle error appropriately, e.g., show error message
      } finally {
        setIsLoadingPaths(false);
      }
    };
    fetchPaths();
  }, []);

  // Assessment questions - also translated via `learning.assessment.questions`
  const assessmentQuestions = Array.from({ length: 10 }).map((_, i) => ({
    question: t(`learning.assessment.questions.${i}.question`),
    options: Object.values(t(`learning.assessment.questions.${i}.options`, { returnObjects: true })) as string[],
    // category can remain if it's not user-facing or used for logic
    category: ['basic', 'internet', 'communication', 'apps', 'communication', 'advanced', 'social', 'security', 'advanced', 'learning'][i]
  }));


  // Calculate skill level from assessment
  const calculateSkillLevel = (answers: number[]) => {
    const total = answers.reduce((sum, answer) => sum + answer, 0);
    const average = total / answers.length;

    if (average <= 1) return 'Beginner';
    if (average <= 2.5) return 'Intermediate';
    return 'Advanced';
  };

  // Load user progress
  useEffect(() => {
    if (userData?.learningProgress) {
      setUserProgress(userData.learningProgress);
    }
    if (userData?.skillLevel) {
      setUserLevel(userData.skillLevel);
    }
    // Only show assessment modal if:
    // 1. User data is loaded (!userLoading)
    // 2. User exists (userData)
    // 3. User hasn't done assessment (!skillAssessmentResult)
    // 4. We're on overview page
    // 5. Not just completed onboarding
    // 6. Not the first load (to prevent flashing)
    const shouldShowAssessment = !userLoading &&
      userData &&
      !userData.skillAssessmentResult &&
      currentView === 'overview' &&
      !sessionStorage.getItem('onboardingJustCompleted');

    setShowAssessmentModal(Boolean(shouldShowAssessment));
  }, [userData, userLoading, currentView]);

  const handleSubmitAssessment = async (answers: SkillAssessmentResult) => {
    // Use values directly from the modal since it now calculates them
    const recommendedPathId = answers.recommendedStartingPathId;
    const determinedSkillLevel = answers.skillLevel;

    try {
      await updateUserData({
        skillAssessmentResult: answers,
        recommendedStartingPathId: recommendedPathId,
        skillLevel: determinedSkillLevel
      });
      setUserLevel(determinedSkillLevel); // Update local state
      // Potentially auto-scroll or highlight the recommended path later
    } catch (error) {
      console.error("Error saving assessment results:", error);
      // Handle error appropriately
    }
    setShowAssessmentModal(false);
  };

  // Save progress
  const saveProgress = async (courseId: string, lessonId: string, completed: boolean = false) => {
    const newProgress = {
      courseId,
      lessonId,
      completed,
      bookmarked: false,
      lastAccessed: new Date(),
      timeSpent: 0
    };
    const currentProgress = Array.isArray(userProgress) ? userProgress : [];
    const updatedProgress = [...currentProgress.filter((p: any) => !(p.courseId === courseId && p.lessonId === lessonId)), newProgress];
    setUserProgress(updatedProgress);

    if (updateUserData) {
      await updateUserData({
        learningProgress: updatedProgress,
        skillLevel: userLevel || undefined
      });
    }
  };

  // Handle assessment
  const handleAssessmentAnswer = (answerIndex: number) => {
    const newAnswers = [...assessmentAnswers, answerIndex];
    setAssessmentAnswers(newAnswers);

    if (assessmentStep < assessmentQuestions.length - 1) {
      setAssessmentStep(assessmentStep + 1);
    } else {
      // Complete assessment
      const level = calculateSkillLevel(newAnswers);
      setUserLevel(level);
      if (updateUserData) {
        updateUserData({ skillLevel: level });
      }
      setCurrentView('overview');
    }
  };

  // Skip assessment
  const skipAssessment = () => {
    setCurrentView('overview');
  };

  // Render assessment view
  if (currentView === 'assessment') {
    const currentQuestion = assessmentQuestions[assessmentStep];

    return (
      <div className="min-h-screen bg-canvas">
        <header className="bg-surface/90 backdrop-blur-md border-b border-hairline">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCurrentView('overview')}
                  className="p-2 text-ink-muted hover:text-ink rounded-full hover:bg-subtle transition-colors focus-ring"
                >
                  {renderIcon(LucideIcons['ArrowLeft'], "w-5 h-5")}
                </button>
                <Logo size="sm" />
                <h1 className="text-xl font-display font-bold text-ink">{t('assessmentView.headerTitle')}</h1>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-12 max-w-2xl">
          <div className="card p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-brand-soft rounded-full flex items-center justify-center mx-auto mb-4">
                {renderIcon(LucideIcons['HelpCircle'], "w-8 h-8 text-brand")}
              </div>
              <h2 className="text-2xl font-display font-bold text-ink mb-2">
                {t('assessmentView.questionProgress', { current: assessmentStep + 1, total: assessmentQuestions.length })}
              </h2>
              <div className="w-full bg-subtle rounded-full h-2 mb-4">
                <div
                  className="bg-brand h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((assessmentStep + 1) / assessmentQuestions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-display font-bold text-ink mb-6 text-center">
                {currentQuestion.question}
              </h3>

              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAssessmentAnswer(index)}
                    className="w-full p-4 text-left rounded-xl border-2 border-hairline hover:border-brand/40 hover:bg-brand-soft transition-all duration-200"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={skipAssessment}
                className="btn-secondary"
              >
                {t('assessmentView.skipAssessment')}
              </button>

              <div className="text-sm text-ink-muted/70">
                {t('assessmentView.chooseBestOption')}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render course view
  if (currentView === 'course' && selectedPath) {
    // Use userProgress (local state) for lesson progress
    const courseProgress = Array.isArray(userProgress)
      ? userProgress.filter((p: any) => p.courseId === selectedPath.id)
      : [];
    const completedLessons = courseProgress.filter((p: any) => p.completed).length;
    const progressPercentage = (completedLessons / selectedPath.modules.length) * 100;

    return (
      <div className="min-h-screen bg-canvas">
        <header className="bg-surface/90 backdrop-blur-md border-b border-hairline">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCurrentView('overview')}
                  className="p-2 text-ink-muted hover:text-ink rounded-full hover:bg-subtle transition-colors focus-ring"
                >
                  {renderIcon(LucideIcons['ArrowLeft'], "w-5 h-5")}
                </button>
                <Logo size="sm" />
                <h1 className="text-xl font-display font-bold text-ink">{t(selectedPath.titleKey)}</h1>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-8 max-w-4xl">
          {/* English Only Notice */}
          <div className="bg-yellow-100 border-l-4 border-yellow-400 text-yellow-800 p-4 rounded mb-8 text-center">
            {t('learningPage.englishOnlyNotice')}
          </div>

          {/* Course Header */}
          <div className="card p-8 mb-8">
            <div className="flex items-start space-x-6">
              <div className={`w-16 h-16 bg-brand-soft rounded-2xl flex items-center justify-center`}>
                {renderIcon(LucideIcons['HelpCircle'], "w-8 h-8 text-brand")}
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-display font-bold text-ink mb-2">{t(selectedPath.titleKey)}</h2>
                <p className="text-lg text-ink-muted mb-4">{t(selectedPath.descriptionKey)}</p>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-ink-muted mb-2">
                    <span>{t('learningPage.progressLabel')}</span>
                    <span>{t('learningPage.completedOutOfTotal', { completed: completedLessons, total: selectedPath.modules.length })}</span>
                  </div>
                  <div className="w-full bg-subtle rounded-full h-2">
                    <div
                      className={`bg-brand h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lessons */}
          <div className="space-y-4">
            <h2 className="text-2xl font-display font-bold text-ink">{t('courseView.lessonsHeader')}</h2>
            {selectedPath.modules.map((lesson, index) => {
              const progressEntry = courseProgress.find((p: any) => p.lessonId === lesson.id) || {};
              const isCompleted = !!progressEntry.completed;
              const isBookmarked = !!progressEntry.bookmarked;
              return (
                <div key={lesson.id} className="card p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isCompleted ? 'bg-green-100' : 'bg-subtle'
                        }`}>
                        {isCompleted ? (
                          renderIcon(LucideIcons['CheckCircle'], "w-6 h-6 text-green-600")
                        ) : (
                          <span className="text-ink-muted font-semibold">{index + 1}</span>
                        )}
                      </div>

                      <div className="flex-1">
                        <h3 className="text-lg font-display font-bold text-ink">{t(lesson.titleKey)}</h3>
                        <p className="text-ink-muted mb-2">{t(lesson.descriptionKey)}</p>
                        <div className="flex items-center space-x-4 text-sm text-ink-muted/70">
                          <div className="flex items-center space-x-1">
                            {renderIcon(LucideIcons['Clock'], "w-4 h-4")}
                            <span>{t('learningPage.moduleTimeLabel')}{lesson.estimatedTime}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => {
                          // Toggle bookmark
                          const newProgress = (userProgress as any[]).map((p: any) =>
                            p.courseId === selectedPath.id && p.lessonId === lesson.id
                              ? { ...p, bookmarked: !p.bookmarked }
                              : p
                          );
                          setUserProgress(newProgress);
                          if (updateUserData) {
                            updateUserData({ learningProgress: newProgress });
                          }
                        }}
                        className={`p-2 rounded-full transition-colors ${isBookmarked ? 'text-yellow-600 bg-yellow-100' : 'text-ink-muted/50 hover:text-ink-muted'
                          }`}
                        title={isBookmarked ? t('courseView.removeBookmark') : t('courseView.addBookmark')}
                      >
                        {renderIcon(LucideIcons['Star'], "w-4 h-4")}
                      </button>
                      <button
                        onClick={() => {
                          setCurrentLessonId(lesson.id);
                          setCurrentView('moduleContent');
                        }}
                        className="btn-primary"
                      >
                        {isCompleted ? t('courseView.reviewLesson') : t('courseView.startLesson')}
                        {renderIcon(LucideIcons['ArrowLeft'], "w-4 h-4 ml-2")}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Course Completion */}
          {progressPercentage === 100 && (
            <div className="card p-8 text-center bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
              {renderIcon(LucideIcons['Award'], "w-16 h-16 text-green-600 mx-auto mb-4")}
              <h2 className="text-2xl font-display font-bold text-ink mb-2">{t('courseView.congratulations')}</h2>
              <p className="text-ink-muted mb-4">{t('courseView.courseComplete', { courseTitle: t(selectedPath.titleKey) })}</p>
              <button className="btn-primary">
                {renderIcon(LucideIcons['Download'], "w-4 h-4 mr-2")}
                {t('courseView.downloadCertificate')}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main overview
  if (currentView === 'overview') {
    return (
      <div className="min-h-screen bg-canvas">
        {showAssessmentModal && !userLoading && (
          <SkillAssessmentModal
            isOpen={showAssessmentModal}
            onClose={() => {
              setShowAssessmentModal(false);
              // When closing without completing, still mark as completed with default values
              // to prevent showing again unless explicitly requested
              if (!userData?.skillAssessmentResult && updateUserData) {
                const defaultAssessment = {
                  skillAssessmentResult: {
                    skillLevel: 'Beginner' as const,
                    recommendedStartingPathId: 'fundamentals',
                    completedAt: new Date(),
                    q1ComfortLevel: 'basics' as const,
                    q2EmailSent: false,
                    q3SmartphoneUsed: false
                  },
                  recommendedStartingPathId: 'fundamentals',
                  skillLevel: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced'
                };
                // Use sessionStorage to track assessment completion
                sessionStorage.setItem('assessmentCompleted', 'true');
                updateUserData(defaultAssessment)
                  .catch(err => console.error("Failed to set default assessment", err));
              }
            }}
            onComplete={handleSubmitAssessment}
          />
        )}
        <header className="bg-surface/90 backdrop-blur-md border-b border-hairline sticky top-0 z-30">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link
                  to="/dashboard"
                  className="p-2 text-ink-muted hover:text-ink rounded-full hover:bg-subtle transition-colors focus-ring"
                >
                  {renderIcon(LucideIcons['ArrowLeft'], "w-5 h-5")}
                </Link>
                <Logo size="sm" />
                <h1 className="text-xl font-display font-bold text-ink">{t('learningPage.headerTitle')}</h1>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
          {/* Hero Section */}
          <div className="text-center mb-6 sm:mb-10">
            <div className="w-14 h-14 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-6">
              {renderIcon(LucideIcons['BookOpen'], "w-7 h-7 sm:w-10 sm:h-10 text-white")}
            </div>
            <h2 className="text-xl sm:text-3xl md:text-4xl font-display font-bold text-ink mb-2 sm:mb-4">
              {t('learningPage.heroTitle')}
            </h2>
            <p className="text-sm sm:text-lg md:text-xl text-ink-muted max-w-3xl mx-auto mb-4 sm:mb-8">
              {t('learningPage.heroSubtitle')}
            </p>
            {userData && userData.skillAssessmentResult && (
              <button
                onClick={() => setShowAssessmentModal(true)}
                className="btn-secondary text-xs sm:text-sm mb-4 sm:mb-8 px-3 py-1.5 sm:px-4 sm:py-2"
              >
                {t('learningPage.retakeAssessment')}
              </button>
            )}
          </div>

          {/* Photo Explainer Feature (Mobile Friendly) */}
          <div className="mb-8 sm:mb-12 flex flex-col items-center justify-center">
            <div className="card w-full max-w-md mx-auto p-4 sm:p-6 flex flex-col items-center">
              <div className="flex items-center space-x-2 mb-2">
                {renderIcon(LucideIcons['Camera'], 'w-6 h-6 text-brand')}
                <h3 className="font-display font-bold text-ink text-base sm:text-lg">{t('learningPage.photoExplainer.title')}</h3>
              </div>
              <p className="text-xs sm:text-sm text-ink-muted mb-3 text-center">{t('learningPage.photoExplainer.description')}</p>
              <div className="flex flex-col sm:flex-row gap-2 w-full justify-center">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="block w-full sm:w-auto text-sm text-ink-muted border border-hairline rounded-lg p-2 mb-2 sm:mb-0"
                  onChange={e => handlePhotoChange(e)}
                  style={{ maxWidth: '180px' }}
                />
                <input
                  type="file"
                  accept="image/*"
                  className="block w-full sm:w-auto text-sm text-ink-muted border border-hairline rounded-lg p-2"
                  onChange={e => handlePhotoChange(e)}
                  style={{ maxWidth: '180px' }}
                />
              </div>
              {photoPreview && (
                <div className="mt-4 w-full flex flex-col items-center">
                  <img src={photoPreview} alt="Preview" className="rounded-lg border border-hairline max-h-48 object-contain" />
                  <button className="btn-primary mt-2 w-full" onClick={handleExplainPhoto}>{t('learningPage.photoExplainer.button')}</button>
                </div>
              )}
            </div>
          </div>

          {/* Learning Paths Grid */}
          {isLoadingPaths && (
            <div className="text-center py-10">
              <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-3 sm:mt-4 text-ink-muted text-sm sm:text-base">{t('learningPage.loadingPaths')}</p>
            </div>
          )}

          {!isLoadingPaths && learningPaths.length === 0 && (
            <div className="text-center py-10">
              <p className="text-ink-muted text-lg sm:text-xl">{t('learningPage.noPathsAvailable')}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 sm:mb-12">
            {learningPaths.map((path) => {
              const totalModulesInPath = path.modules.length;
              const completedModulesForPath = path.modules.filter(
                module => userData?.userLearningProgress?.completedModules?.[module.id]
              ).length;
              const progressPercent = totalModulesInPath > 0 ? (completedModulesForPath / totalModulesInPath) * 100 : 0;

              const IconComponent = LucideIcons[path.iconName as keyof typeof LucideIcons];
              const isPathBadgeEarned = userData?.userLearningProgress?.earnedBadges?.[path.badgeIdOnCompletion] || false;

              return (
                <div
                  key={path.id}
                  className="card p-3 sm:p-5 hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-1 rounded-xl"
                  onClick={() => {
                    setSelectedPath(path);
                    setCurrentView('pathDetail');
                  }}
                >
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 bg-brand-soft rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6`}>
                    {renderIcon(IconComponent, 'w-6 h-6 sm:w-8 sm:h-8 text-brand')}
                  </div>

                  <h3 className="text-lg sm:text-xl font-display font-bold text-ink mb-2 text-center">{t(path.titleKey)}</h3>
                  <p className="text-ink-muted mb-3 sm:mb-4 text-xs sm:text-sm text-center h-10 sm:h-12 overflow-hidden">
                    {t(path.descriptionKey)}
                  </p>

                  <div className="w-full bg-subtle rounded-full h-2 sm:h-2.5 mb-1 sm:mb-2">
                    <div
                      className="bg-brand h-2 sm:h-2.5 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <p className="text-ink-muted/70">{t('learningPage.progressComplete', { value: Math.round(progressPercent) })}</p>
                    {isPathBadgeEarned && (
                      <div title={t(getBadgeById(path.badgeIdOnCompletion)?.nameKey || '')} className="text-yellow-500">
                        {renderIcon(LucideIcons['Award'], "w-3 h-3 sm:w-4 sm:h-4")}
                      </div>
                    )}
                  </div>

                  {userData?.recommendedStartingPathId === path.id && !isPathBadgeEarned && (
                    <div className="mt-2 sm:mt-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium bg-green-100 text-green-800">
                        {renderIcon(LucideIcons['Star'], "w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5")}
                        {t('learningPage.recommendedStart')}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Features Section */}
          <div className="text-center mb-8 sm:mb-12 pt-8 sm:pt-12 border-t border-hairline">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-ink mb-3 sm:mb-4">{t('learningPage.featuresGridTitle')}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {[
              { iconName: 'Play', titleKey: "learningPage.featureInteractiveDemos", descriptionKey: "learningPage.featureInteractiveDemosDesc" },
              { iconName: 'Volume2', titleKey: "learningPage.featureAudioSupport", descriptionKey: "learningPage.featureAudioSupportDesc" },
              { iconName: 'Download', titleKey: "learningPage.featurePrintableGuides", descriptionKey: "learningPage.featurePrintableGuidesDesc" },
              { iconName: 'Award', titleKey: "learningPage.featureCertificates", descriptionKey: "learningPage.featureCertificatesDesc" }
            ].map((feature, index) => {
              const FeatureIcon = LucideIcons[feature.iconName as keyof typeof LucideIcons];
              return (
                <div key={index} className="text-center p-4 sm:p-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-soft rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    {renderIcon(FeatureIcon, "w-5 h-5 sm:w-6 sm:h-6 text-brand")}
                  </div>
                  <h3 className="font-display font-bold text-ink mb-1 sm:mb-2 text-sm sm:text-base">{t(feature.titleKey)}</h3>
                  <p className="text-xs sm:text-sm text-ink-muted">{t(feature.descriptionKey)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  } // End of 'overview' view

  // Placeholder for pathDetail and moduleContent views
  if (currentView === 'pathDetail' && selectedPath) {
    // Add a button to start/continue the course
    return (
      <div>
        <header className="bg-surface/90 backdrop-blur-md border-b border-hairline sticky top-0 z-30">
          <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center space-x-3 sm:space-x-4">
            <button onClick={() => setCurrentView('overview')} className="p-2 text-ink-muted hover:text-ink rounded-full hover:bg-subtle focus-ring">
              {renderIcon(LucideIcons['ArrowLeft'], "w-5 h-5")}
            </button>
            <Logo size="sm" />
            <h1 className="text-lg sm:text-xl font-display font-bold text-ink">{t(selectedPath.titleKey)}</h1>
          </div>
        </header>
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">{t(selectedPath.descriptionKey)}</h2>
          <p className="mb-4 sm:mb-6 text-sm sm:text-base">{t('learningPage.moduleListTitle', { pathTitle: t(selectedPath.titleKey) })}</p>
          <div className="space-y-3 sm:space-y-4">
            {(selectedPath.modules as Module[]).map(module => (
              <div key={module.id} className="card p-3 sm:p-4">
                <h3 className="text-base sm:text-lg font-semibold">{t(module.titleKey)}</h3>
                <p className="text-xs sm:text-sm text-ink-muted">{t(module.descriptionKey)}</p>
                <p className="text-xs text-ink-muted/70 mt-1">{t('learningPage.moduleTimeLabel')}{module.estimatedTime}</p>
              </div>
            ))}
          </div>
          {/* Start/Continue Course Button */}
          <div className="mt-8 text-center">
            <button
              className="btn-primary px-6 py-3 text-lg"
              onClick={() => {
                setCurrentLessonId(selectedPath.modules[0]?.id || null);
                setCurrentView('moduleContent');
              }}
            >
              {t('learningPage.startOrContinueCourse')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Ensure currentLessonId is set when entering moduleContent
  if (currentView === 'moduleContent' && selectedPath) {
    let lessonId = currentLessonId;
    if (!lessonId && selectedPath.modules.length > 0) {
      lessonId = selectedPath.modules[0].id;
      setCurrentLessonId(lessonId);
    }
    if (!lessonId) {
      return <div className="p-8 text-center text-ink-muted/70">{t('learningPage.noLessonAvailable')}</div>;
    }
    const lessonIndex = (selectedPath.modules as Module[]).findIndex(m => m.id === lessonId);
    const lesson = (selectedPath.modules as Module[])[lessonIndex];
    const isCompleted = Array.isArray(userProgress)
      ? !!userProgress.find((p: any) => p.courseId === selectedPath.id && p.lessonId === lesson.id && p.completed)
      : false;
    // --- Render real content if available ---
    return (
      <div>
        <header className="bg-surface/90 backdrop-blur-md border-b border-hairline sticky top-0 z-30">
          <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center space-x-3 sm:space-x-4">
            <button onClick={() => setCurrentView('course')} className="p-2 text-ink-muted hover:text-ink rounded-full hover:bg-subtle focus-ring">
              {renderIcon(LucideIcons['ArrowLeft'], "w-5 h-5")}
            </button>
            <Logo size="sm" />
            <h1 className="text-lg sm:text-xl font-display font-bold text-ink">{t(selectedPath.titleKey)}</h1>
          </div>
        </header>
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-2xl">
          <h2 className="text-2xl font-bold mb-4">{t(lesson.titleKey)}</h2>
          <p className="mb-6 text-ink-muted">{t(lesson.descriptionKey)}</p>
          {/* Render real lesson content if available */}
          <div className="mb-8 p-4 bg-subtle rounded-xl border border-hairline">
            {lesson.content ? (
              <div>
                {/* Example: allow HTML or JSX for rich content */}
                {typeof lesson.content === 'string' ? (
                  <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
                ) : lesson.content}
              </div>
            ) : (
              t('learningPage.lessonContentPlaceholder', { lessonTitle: t(lesson.titleKey) })
            )}
          </div>
          <div className="flex justify-between items-center">
            <button
              disabled={lessonIndex === 0}
              className="btn-secondary"
              onClick={() => setCurrentLessonId(selectedPath.modules[lessonIndex - 1].id)}
            >
              {t('courseView.previousLesson')}
            </button>
            <button
              className={`btn-primary ${isCompleted ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isCompleted}
              onClick={async () => {
                await saveProgress(selectedPath.id, lesson.id, true);
              }}
            >
              {isCompleted ? t('courseView.completed') : t('courseView.markAsComplete')}
            </button>
            <button
              disabled={lessonIndex === selectedPath.modules.length - 1}
              className="btn-secondary"
              onClick={() => setCurrentLessonId(selectedPath.modules[lessonIndex + 1].id)}
            >
              {t('courseView.nextLesson')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-ink-muted">{t('learningPage.loadingCenter')}</p>
    </div>
  );
};

// Define the renderIcon helper at the top of the component:
function renderIcon(IconComponent: any, className: string) {
  if (typeof IconComponent === 'function' || (IconComponent && IconComponent.$$typeof)) {
    return <IconComponent className={className} />;
  }
  return <HelpCircle className={className} />;
}

export default LearningCenterPage;