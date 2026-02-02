<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        $this->call(AccompaniedPeopleSeeder::class);
        $this->call(AppointmentExceptionsSeeder::class);
        $this->call(AppointmentsSeeder::class);
        $this->call(CaregiverCoursesSeeder::class);
        $this->call(CaregiverReviewsSeeder::class);
        $this->call(ConversationMessagesSeeder::class);
        $this->call(ConversationsSeeder::class);
        $this->call(DevicesSeeder::class);
        $this->call(DoctorsSeeder::class);
        $this->call(EmergencyContactsSeeder::class);
        $this->call(GroupActivitiesSeeder::class);
        $this->call(GroupMembersSeeder::class);
        $this->call(GroupMessagesSeeder::class);
        $this->call(GroupSettingsSeeder::class);
        $this->call(GroupsSeeder::class);
        $this->call(InvitationCodesSeeder::class);
        $this->call(MedicalSpecialtiesSeeder::class);
        $this->call(MedicationCatalogSeeder::class);
        $this->call(MedicationLogsSeeder::class);
        $this->call(MedicationsSeeder::class);
        $this->call(MessagesSeeder::class);
        $this->call(NotificationsSeeder::class);
        $this->call(OrderItemsSeeder::class);
        $this->call(OrdersSeeder::class);
        $this->call(PanicEventsSeeder::class);
        $this->call(PlansSeeder::class);
        $this->call(PrescriptionsSeeder::class);
        $this->call(StoreDisputesSeeder::class);
        $this->call(StoreEscrowsSeeder::class);
        $this->call(StoreOrderItemsSeeder::class);
        $this->call(StoreOrdersSeeder::class);
        $this->call(StoreTrackingEventsSeeder::class);
        $this->call(SupplierCategoriesSeeder::class);
        $this->call(SupplierProductsSeeder::class);
        $this->call(SuppliersSeeder::class);
        $this->call(SystemSettingsSeeder::class);
        $this->call(UserPlansSeeder::class);
        $this->call(UsersSeeder::class);
        $this->call(VitalSignsSeeder::class);
    }
}
